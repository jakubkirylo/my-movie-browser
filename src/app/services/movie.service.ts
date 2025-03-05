import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, of } from 'rxjs';
import {
  OMDbMovieDetail,
  OMDbSearchResponse,
} from '../interfaces/movie.interface';

@Injectable({
  providedIn: 'root',
})
export class MovieService {
  private apiKey = 'b1627cf3';
  private baseUrl = 'http://www.omdbapi.com/';

  private readonly _http = inject(HttpClient);

  public searchMovies(
    searchKey: string | null,
    page: number
  ): Observable<OMDbSearchResponse | null> {
    const url = `${this.baseUrl}?apikey=${this.apiKey}&s=${searchKey}&page=${page}`;
    return this._http.get<OMDbSearchResponse>(url).pipe(
      catchError((error) => {
        console.warn('Search movies error: ', error);
        return of(null);
      })
    );
  }

  public fetchMovieDetails(imdbId: string): Observable<OMDbMovieDetail | null> {
    const url = `${this.baseUrl}?apikey=${this.apiKey}&i=${imdbId}`;
    return this._http.get<OMDbMovieDetail>(url).pipe(
      catchError((error) => {
        console.warn('Fetch movie details error: ', error);
        return of(null);
      })
    );
  }
}
