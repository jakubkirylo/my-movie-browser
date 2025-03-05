import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, EMPTY, Observable, of } from 'rxjs';
import { OMDbSearchResponse } from '../interfaces/movie.interface';

@Injectable({
  providedIn: 'root',
})
export class MovieService {
  private apiKey = 'b1627cf3';
  private baseUrl = 'http://www.omdbapi.com/';

  private readonly _http = inject(HttpClient);

  public searchMovies(
    searchKey: string | null
  ): Observable<OMDbSearchResponse> {
    if (!searchKey) {
      return EMPTY;
    }

    const url = `${this.baseUrl}?apikey=${this.apiKey}&s=${searchKey}`;
    return this._http.get<OMDbSearchResponse>(url).pipe(
      catchError((error) => {
        console.warn('Search movies error: ', error);
        return EMPTY;
      })
    );
  }
}
