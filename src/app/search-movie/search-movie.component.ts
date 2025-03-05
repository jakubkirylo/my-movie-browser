import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { MovieService } from '../services/movie.service';
import { OMDbSearchResult } from '../interfaces/movie.interface';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { TableHeaders } from '../interfaces/table.interfaces';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-search-movie',
  imports: [ReactiveFormsModule, CommonModule, CdkDrag, CdkDropList],
  templateUrl: './search-movie.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchMovieComponent {
  private readonly _movieService = inject(MovieService);

  public searchControl = new FormControl('');
  public readonly loading = signal(false);
  public readonly movies = signal<OMDbSearchResult[]>([]);

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
        debounceTime(500),
        distinctUntilChanged(),
        takeUntilDestroyed(),
        switchMap((value) => {
          this.loading.set(true);
          return this._movieService.searchMovies(value);
        })
      )
      .subscribe((response) => {
        if (response.Response === 'True') {
          if (response.Search !== undefined) {
            this.loading.set(false);
            this.movies.set(response.Search);
          }
        }
      });
  }

  public drop(event: CdkDragDrop<string[]>): void {
    moveItemInArray(this.headers, event.previousIndex, event.currentIndex);
  }

  public sortData(field: string): void {
    // TODO: implement sorting data
  }
}
