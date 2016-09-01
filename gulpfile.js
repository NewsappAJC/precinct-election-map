var gulp = require('gulp'),
  argv = require('yargs').argv,
  rename = require('gulp-rename'),
  buffer = require('vinyl-buffer'), // Vinyl is an interface between browserify and gulp
  livereload = require('gulp-livereload'),
  awspublish = require('gulp-awspublish');
  source = require('vinyl-source-stream'),
  sourcemaps = require('gulp-sourcemaps'),
  rimraf = require('rimraf');
  sass = require('gulp-sass'),
  browserify = require('browserify'),
  bs = require('browser-sync'),
  babelify = require('babelify'),
  webserver = require('gulp-webserver'),
  merge = require('merge-stream'),
  uglify = require('gulp-uglify'),
  runSequence = require('run-sequence');

var SRC = './assets/';
var PROD = './dist/prod/';
var DEV = './dist/dev/';

var ENV = argv.production ? PROD : DEV;
console.log(argv, argv.production)

var browserSync = {
  port: 8080,
  server: {
    baseDir: './dist/dev/',
  }
}

gulp.task('compile', ['bundle'], function() {
  if (ENV === PROD) {
    return gulp.src(ENV + 'main.js')
      .pipe(uglify())
      .pipe(gulp.dest(ENV))
  }
});

gulp.task('bundle', function() {
  var b = browserify({
    entries: SRC + 'js/index.js',
    debug: true,
    transform: [babelify.configure({
      presets: ['es2015']
    })]
  });

  return bundle = b.bundle()
    .pipe(source(SRC + 'js/index.js'))
    .pipe(buffer())
    .pipe(rename('main.js'))
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(ENV));
})

gulp.task('sass', function(){
  return gulp.src([SRC + 'css/*.scss', SRC + 'css/**/*.css'])
    .pipe(sass()) // Using gulp-sass
    .pipe(gulp.dest(ENV + 'css/'));
});

gulp.task('build-assets', function(done) {
  var html = gulp.src(SRC + 'index.html')
  .pipe(gulp.dest(ENV));

  var fonts = gulp.src(SRC + 'css/fonts/**/*.otf')
    .pipe(gulp.dest(ENV + 'css/fonts'));

  var images = gulp.src(SRC + 'img/**')
    .pipe(gulp.dest(ENV + 'img'));

  return merge(html, fonts, images); // Merge emits events from multiple streams
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

gulp.task('serve', ['sass', 'compile', 'build-assets', 
'watch-sass', 'watch-js', 'watch-assets'], function() {
  bsIns = bs.create();
  bsIns.init(browserSync);
  bsIns.reload();
  console.log('Serving from ' + ENV)
});

gulp.task('build', ['sass', 'compile', 'build-assets'], function() {
})

gulp.task('publish', function(){
  var AWS = require('aws-sdk');
  var bucket = argv.staging ? 'ajcnewsapps/2016/deadly-encounter-staging' : 'investigations.myajc.com/deadly-encounter';
  // create a new publisher using S3 options 
  // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#constructor-property 
  const publisher = awspublish.create({
    region: 'us-east-1',
    params: {
      Bucket: 'ajcnewsapps.s3-website-us-east-1.amazonaws.com/2016/deadly-encounter-staging' ,
      ACL: 'public-read'
    },
    credentials: new AWS.SharedIniFileCredentials({profile: 'default'})
  });
 
  // define custom headers 
  const headers = {
    'Cache-Control': 'max-age=2592000, no-transform, public'
  };
  const options = {
    //force: true //bypass cache / skip if you need to for some reason
  }

  return gulp.src(PROD+'**/*')
    // publisher will add Content-Length, Content-Type and headers specified above 
    // If not specified it will set x-amz-acl to public-read by default 
    .pipe(publisher.publish(headers, options)) //upload new/changed files
    .pipe(publisher.sync()) //remove deleted files
    // create a cache file to speed up consecutive uploads 
    .pipe(publisher.cache())
 
     // print upload updates to console 
    .pipe(awspublish.reporter({
      states: ['create', 'update', 'delete']
    })); //if it appears to be hanging and you want to 'skip' states add that to the array
});
