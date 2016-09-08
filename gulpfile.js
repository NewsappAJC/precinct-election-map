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
  cssnano = require('gulp-cssnano');
  path   = require('path'),
  rename = require('gulp-rename'),
  awspublish = require('gulp-awspublish');

var SRC = './assets/';
var PROD = './dist/prod/';
var DEV = './dist/dev/';

var ENV = argv.production ? PROD : DEV;

var browserSync = {
  port: 8080,
  server: {
    baseDir: ENV,
  }
}

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
});

gulp.task('compile', gulp.series('bundle', function(done) {
  if (ENV === PROD) {
    return gulp.src(ENV + 'main.js')
      .pipe(uglify())
      .pipe(gulp.dest(ENV))
  }
  done();
}));

gulp.task('sass', function(){
  return gulp.src([SRC + 'css/*.scss', SRC + 'css/**/*.css'])
    .pipe(sourcemaps.init())
    .pipe(sourcemaps.write())
    .pipe(sass()) // Using gulp-sass
    .pipe(gulp.dest(ENV + 'css/'));
});

gulp.task('build-assets', function() {
  var html = gulp.src(SRC + 'index.html')
  .pipe(gulp.dest(ENV));

  var fonts = gulp.src(SRC + 'css/fonts/**/*.otf')
    .pipe(gulp.dest(ENV + 'css/fonts'));

  var images = gulp.src(SRC + 'img/**')
    .pipe(gulp.dest(ENV + 'img'));

  var css = gulp.src(ENV + 'css/style.css')
    .pipe(cssnano())
    .pipe(gulp.dest(function(file){
      return file.base; //replace current file
    }));

  return merge(html, fonts, images, css); // Merge emits events from multiple streams
})

gulp.task('watch', function(done) {
  gulp.watch(SRC + 'css/*.scss', gulp.series('sass'));

  gulp.watch(SRC + 'js/*.js', gulp.series('compile'));

  gulp.watch([SRC + 'img/*', SRC + 'index.html'], gulp.series('build-assets'));
  done();
});

gulp.task('serve', gulp.series('sass', 'compile', 'build-assets', 
'watch', function() {
  bsIns = bs.create();
  bsIns.init(browserSync);
  bsIns.reload();
  console.log('Serving from ' + ENV)
}));

gulp.task('build', gulp.series('sass', 'compile', 'build-assets', function(done) {
  done();
}));

/*
gulp.task('publish', function(){
  var AWS = require('aws-sdk');

  var staging_bucket = "ajc-staging-sites",
  prod_bucket = "investigations.myajc.com",
  staging_subdir = 'deadly-encounter-staging', //s3 bucket subdirectory DO NOT RUN SYNC WITH SUBDIRECTORIES,
  prod_subdir = 'deadly-encounter';

  if(ENV === PROD){
    var s3_bucket = prod_bucket,
    s3_subdir = prod_subdir;
  } else {
    var s3_bucket = staging_bucket,
    s3_subdir = staging_subdir;
  }
  // create a new publisher using S3 options 
  // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#constructor-property 
  var publisher = awspublish.create({
    region: 'us-east-1',
    params: {
      Bucket: s3_bucket,
      //Key: 'testing-directory',
      ACL: 'public-read'
    },
    credentials: new AWS.SharedIniFileCredentials({profile: 'default'})
  });
 
  // define custom headers 
  var headers = {
    'Cache-Control': 'max-age=2592000, no-transform, public'
  };
  var options = {
    //force: true //bypass cache / skip if you need to for some reason
  }

  /********************************************
  DO NOT RUN `publisher.sync()` when targeting
  a child directory of a bucket or it will 
  delete everything else in the bucket
  *********************************************
  return gulp.src(PROD + '**\/*')
    //because we are targeting a child path of a bucket we need to modify the path the reflect that
    .pipe(rename(function(filePath) {
      filePath.dirname = path.join(s3_subdir, filePath.dirname);
    }))
    // publisher will add Content-Length, Content-Type and headers specified above 
    // If not specified it will set x-amz-acl to public-read by default 
    .pipe(publisher.publish(headers, options)) //upload new/changed files
    // create a cache file to speed up consecutive uploads 
    .pipe(publisher.cache())
 
     // print upload updates to console 
    .pipe(awspublish.reporter({
      states: ['create', 'update', 'delete']
    })); //if it appears to be hanging and you want to 'skip' states add that to the array
});

gulp.task('deploy', gulp.series('build', 'publish', function(done){
  done();
})); */
