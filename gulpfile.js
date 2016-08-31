var gulp = require('gulp'),
  rename = require('gulp-rename'),
  buffer = require('vinyl-buffer'), // Vinyl is an interface between browserify and gulp
  livereload = require('gulp-livereload'),
  source = require('vinyl-source-stream'),
  sourcemaps = require('gulp-sourcemaps'),
  rimraf = require('rimraf');
  sass = require('gulp-sass'),
  browserify = require('browserify'),
  bs = require('browser-sync'),
  babelify = require('babelify'),
  webserver = require('gulp-webserver');
  merge = require('merge-stream');

var SRC = './assets/';
var PROD = './dist/prod/';
var DEV = './dist/dev/';

var browserSync = {
  port: 8080,
  server: {
    baseDir: './dist/dev/',
  }
}

gulp.task('compile', function() {
  var b = browserify({
    entries: SRC + 'js/index.js',
    debug: true,
    transform: [babelify.configure({
      presets: ['es2015']
    })]
  });

  return b.bundle()
    .pipe(source(SRC + 'js/index.js'))
    .pipe(buffer())
    .pipe(rename('main.js'))
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(DEV));
});

gulp.task('sass', function(){
  return gulp.src([SRC + 'css/*.scss', SRC + 'css/**/*.css'])
    .pipe(sass()) // Using gulp-sass
    .pipe(gulp.dest(DEV + 'css/'));
});


gulp.task('build-assets', function(done) {
  var html = gulp.src(SRC + 'index.html')
  .pipe(gulp.dest(DEV));

  var fonts = gulp.src(SRC + 'css/fonts/**/*.otf')
    .pipe(gulp.dest(DEV + 'css/fonts'));

  var images = gulp.src(SRC + 'img/**')
    .pipe(gulp.dest(DEV + 'img'));

  return merge(html, fonts, images); // Emits events from multiple streams
})

gulp.task('watch-sass', function() {
  return gulp.watch(SRC + 'css/*.scss', ['sass']);
});

gulp.task('watch-js', function() {
  return gulp.watch(SRC + 'js/*.js', ['compile']);
});

gulp.task('watch-assets', function() {
  return gulp.watch([SRC + 'index.html', SRC + 'img/*'], ['build-assets']);
})

gulp.task('serve-dev', ['sass', 'compile', 'build-assets', 
'watch-sass', 'watch-js', 'watch-assets'], function() {
  bsIns = bs.create();
  bsIns.init(browserSync);
  bsIns.reload();
});
