import { Component } from '@angular/core';
import { SearchMovieComponent } from './search-movie/search-movie.component';

@Component({
  selector: 'app-root',
  imports: [SearchMovieComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {}
