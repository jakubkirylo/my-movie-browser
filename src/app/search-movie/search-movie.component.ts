import {
    CdkDrag,
    CdkDragDrop,
    CdkDropList,
    moveItemInArray,
} from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    inject,
    OnInit,
    signal,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
    combineLatest,
    debounceTime,
    distinctUntilChanged,
    filter,
    forkJoin,
    map,
    Observable,
    of,
    Subject,
    switchMap,
    takeUntil,
    tap,
} from 'rxjs';
import {
    OMDbMovieDetail,
    OMDbSearchResponse,
} from '../interfaces/movie.interface';
import { TableHeaders } from '../interfaces/table.interfaces';
import { MovieService } from '../services/movie.service';

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
        MatTooltipModule,
    ],
    templateUrl: './search-movie.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchMovieComponent implements OnInit {
    private readonly _movieService = inject(MovieService);

    public searchControl = new FormControl('');
    public readonly loading = signal(false);
    public readonly movies = signal<OMDbMovieDetail[]>([]);
    public readonly totalResults = signal(0);
    public readonly pageIndex = signal(0);
    public readonly pageIndex$ = toObservable(this.pageIndex);

    public readonly headers: TableHeaders[] = [
        {
            label: 'Poster',
            field: 'Poster',
            style: 'hidden sm:flex sm:w-16 md:w-20',
        },
        {
            label: 'Title',
            field: 'Title',
            style: 'w-40 sm:w-48 md:w-56 lg:w-64',
        },
        { label: 'Year', field: 'Year', style: 'w-16 sm:w-20 md:w-24' },
        { label: 'Runtime', field: 'Runtime', style: 'w-16 sm:w-20 md:w-24' },
        { label: 'Genre', field: 'Genre', style: 'w-32 sm:w-40 md:w-48' },
        { label: 'Director', field: 'Director', style: 'w-32 sm:w-40 md:w-48' },
        { label: 'Plot', field: 'Plot', style: 'min-w-[500px] flex-1' },
    ];

    private sortColumn: string = '';
    private sortDirection: 'asc' | 'desc' = 'asc';

    private readonly ngUnsubscribe = new Subject();

    ngOnInit(): void {
        this.searchControl.valueChanges
            .pipe(
                tap(() => {
                    if (this.pageIndex() !== 0) {
                        this.pageIndex.set(0);
                    }
                }),
                takeUntil(this.ngUnsubscribe)
            )
            .subscribe();

        combineLatest([this.searchControl.valueChanges, this.pageIndex$])
            .pipe(
                debounceTime(500),
                distinctUntilChanged(),
                takeUntil(this.ngUnsubscribe),
                tap(() => this.loading.set(true)),
                filter(([value, _]) => !!value),
                switchMap(([value, pageIndex]) =>
                    this._movieService.searchMovies(value, pageIndex + 1)
                ),
                switchMap(
                    (response): Observable<OMDbSearchResponse> =>
                        this.processResponse(response)
                )
            )
            .subscribe(response => {
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
        // TODO: OMDb API does not support data sorting, also does not allow to download all results at once - only paginated results
        // Possible solution: polling to get all data, save it in store, do the sorting/filtering on stored data
        // Sorting only on visible records

        if (this.sortColumn === sort.active) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = sort.active;
            this.sortDirection = 'asc';
        }

        this.movies.set(
            [...this.movies()].sort((a: any, b: any) => {
                let aField: any = a[sort.active];
                let bField: any = b[sort.active];

                // Runtime comes as, eg. "49 min".
                if (sort.active === 'Runtime') {
                    aField = parseInt(aField?.replace(' min', ''), 10) || 0;
                    bField = parseInt(bField?.replace(' min', ''), 10) || 0;
                }

                if (aField < bField) {
                    return this.sortDirection === 'asc' ? -1 : 1;
                } else if (aField > bField) {
                    return this.sortDirection === 'asc' ? 1 : -1;
                }
                return 0;
            })
        );
    }

    public handlePageEvent(ev: PageEvent): void {
        this.pageIndex.set(ev.pageIndex);
    }

    private processResponse(
        response: OMDbSearchResponse | null
    ): Observable<OMDbSearchResponse> {
        if (
            response !== null &&
            response.Response === 'True' &&
            response.Search &&
            response.Search.length > 0
        ) {
            return forkJoin(
                response?.Search?.map(movie =>
                    movie.imdbID
                        ? this._movieService
                              .fetchMovieDetails(movie.imdbID)
                              .pipe(map(detail => (detail ? detail : movie)))
                        : of(movie as OMDbMovieDetail)
                )
            ).pipe(
                map(detailedMovies => {
                    return {
                        ...response,
                        Search: detailedMovies,
                    };
                })
            );
        }
        return of(response as OMDbMovieDetail);
    }
}
