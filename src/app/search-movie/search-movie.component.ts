import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { MovieService } from '../services/movie.service';
import {
  OMDbMovieDetail,
  OMDbSearchResponse,
} from '../interfaces/movie.interface';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  forkJoin,
  map,
  Observable,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { TableHeaders } from '../interfaces/table.interfaces';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-search-movie',
  imports: [
    ReactiveFormsModule,
    CommonModule,
    CdkDrag,
    CdkDropList,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatInputModule,
    MatSortModule,
    MatIconModule,
  ],
  templateUrl: './search-movie.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchMovieComponent {
  private readonly _movieService = inject(MovieService);

  public searchControl = new FormControl('');
  public readonly loading = signal(false);
  public readonly movies = signal<OMDbMovieDetail[]>([]);
  public readonly totalResults = signal(0);
  public readonly pageIndex = signal(0);

  public readonly headers: TableHeaders[] = [
    { label: 'Poster', field: 'Poster' },
    { label: 'Title', field: 'Title' },
    { label: 'Year', field: 'Year' },
    { label: 'Runtime', field: 'Runtime' },
    { label: 'Genre', field: 'Genre' },
    { label: 'Director', field: 'Director' },
    { label: 'Plot', field: 'Plot' },
  ];

  constructor() {
    this.searchControl.valueChanges
      .pipe(
        tap(() => {
          if (this.pageIndex() !== 0) {
            this.pageIndex.set(0);
          }
        }),
        takeUntilDestroyed()
      )
      .subscribe();

    combineLatest([
      this.searchControl.valueChanges,
      toObservable(this.pageIndex),
    ])
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntilDestroyed(),
        tap(() => this.loading.set(true)),
        filter(([value, _]) => !!value),
        switchMap(([value, pageIndex]) =>
          this._movieService.searchMovies(value, pageIndex + 1)
        ),
        switchMap((response): Observable<OMDbSearchResponse> => {
          if (
            response !== null &&
            response.Response === 'True' &&
            response.Search &&
            response.Search.length > 0
          ) {
            return forkJoin(
              response?.Search?.map((movie) =>
                movie.imdbID
                  ? this._movieService
                      .fetchMovieDetails(movie.imdbID)
                      .pipe(map((detail) => (detail ? detail : movie)))
                  : of(movie as OMDbMovieDetail)
              )
            ).pipe(
              map((detailedMovies) => {
                return {
                  ...response,
                  Search: detailedMovies,
                };
              })
            );
          }
          return of(response as OMDbMovieDetail);
        })
      )
      .subscribe((response) => {
        if (response?.Response === 'True') {
          if (response.Search !== undefined) {
            this.loading.set(false);
            this.movies.set(response.Search as OMDbMovieDetail[]);
            this.totalResults.set(Number(response.totalResults));
          }
        } else {
          this.loading.set(false);
          this.movies.set([]);
        }
      });
  }

  public drop(event: CdkDragDrop<string[]>): void {
    moveItemInArray(this.headers, event.previousIndex, event.currentIndex);
  }

  public sortData(sort: Sort): void {
    // TODO: implement sorting data
    console.warn('sort data', sort);
  }

  public handlePageEvent(ev: PageEvent): void {
    this.pageIndex.set(ev.pageIndex);
  }
}
