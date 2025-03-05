import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, EMPTY, Observable, of, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MovieService {
  private apiKey = 'b1627cf3';
  private baseUrl = 'http://www.omdbapi.com/';

  private readonly _http = inject(HttpClient);

  public searchMovies(searchKey: string): Observable<any> {
    if (!searchKey) {
      return of([]);
    }

    const url = `${this.baseUrl}?apikey=${this.apiKey}&s=${searchKey}`;
    return this._http.get<any>(url).pipe(
      switchMap((response) => {
        console.warn('response', response);
        return response;
      }),
      catchError((error) => {
        console.warn('Search movies error: ', error);
        return EMPTY;
      })
    );
  }
}
