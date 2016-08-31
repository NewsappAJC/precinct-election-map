const gulp = require('gulp');
const sass = require('gulp-sass');

gulp.task('sass', function(){
  return gulp.src('assets/css/style.scss')
    .pipe(sass({includePaths: ['node_modules/foundation-sites/scss']})) // Using gulp-sass
    .pipe(gulp.dest('dist/prod/css/'));
});
