'use strict';
// Import task modules and setting up variables.
var gulp = require('gulp'),
  del = require('del'),
  sass = require('gulp-sass'),
  browserSync = require('browser-sync'),
  uglify = require('gulp-uglify'),
  jshint = require('gulp-jshint'),
  rename = require('gulp-rename'),
  concat = require('gulp-concat'),
  gutil = require('gulp-util'),
  autoprefixer = require('gulp-autoprefixer'),
  cssnano = require('gulp-cssnano'),
  sourcemaps = require('gulp-sourcemaps'),
  gulpif = require('gulp-if'),
  imagemin = require('gulp-imagemin'),
  runSequence = require('run-sequence'),
  gulpStylelint = require('gulp-stylelint'),
  assemble = require('fabricator-assemble'),
  cache = require('gulp-cache'),
  plumber = require('gulp-plumber'),
  reload = browserSync.reload,
  _ = require('lodash'),
  Handlebars = require('handlebars'),
  handlebarsHelpers = require('handlebars-helpers')(),
  htmlreplace = require('gulp-html-replace'),
  // Set base directories
  base = {
    title: 'Publicis.Sapient',
    src: 'src/',
    dist: 'dist/'
  },
  // Set paths
  paths = {
    libs: {
      js: [
        'node_modules/jquery/dist/jquery.js',
        'node_modules/lodash/lodash.js',
        'node_modules/moment/moment.js',
        'node_modules/tabulator-tables/dist/js/tabulator.js',
        'node_modules/js-cookie/src/js.cookie.js',
        'node_modules/svg.js/dist/svg.js',
        'node_modules/animejs/lib/anime.min.js',
        'node_modules/select2/dist/js/select2.full.js',
        base.src + 'scripts/vendors/**/*.js'
      ]
    },
    dist: {
      css: base.dist + 'styles',
      js: base.dist + 'scripts',
      html: base.dist + '/',
      fonts: base.dist + 'fonts',
      data: base.dist + 'data',
      content: base.dist + 'content'
    },
    src: {
      sass: base.src + 'sass/style.scss',
      js: base.src + 'scripts/**/*.js',
      data: base.src + 'data',
      content: base.src + 'content'
    },
    fonts: [base.src + 'fonts/**/**.*', base.src + 'fonts/**.*'],
    styles: {
      src: base.src + 'sass/style.scss',
      dest: base.dist + 'styles',
      watch: base.src + 'sass/**/*',
      browsers: ['last 1 version']
    },
    scripts: {
      src: base.src + 'scripts/**/*.js',
      dest: base.dist + 'scripts',
      watch: base.src + 'scripts/**/*'
    },
    images: {
      src: base.src + 'content/images/**/*',
      dest: base.dist + 'images',
      watch: base.src + 'content/images/**/*'
    },
    templates: {
      src: [base.src + 'templates/**/*'],
      dest: base.dist,
      watch: [base.src + 'templates/**/*', 'data/**/*.json'],
      layouts: base.src + 'templates/views/layouts/*',
      layoutIncludes: base.src + 'templates/views/layouts/includes/*',
      views: [base.src + 'templates/views/**/*', '!' + base.src + 'templates/views/layouts/**'],
      materials: base.src + 'templates/materials/**/*',
      docs: base.src + 'templates/docs/**/*.md',
      data: base.src + 'templates/config/**/*.{json,yml}'
    },
    dev: gutil.env.dev
  };

console.log('ENV: ', paths.dev);
//***************** BUILD TASKS*********************

// templates
gulp.task('templates', done => {
  assemble({
    layouts: paths.templates.layouts,
    layoutIncludes: paths.templates.layoutIncludes,
    views: paths.templates.views,
    materials: paths.templates.materials,
    docs: paths.templates.docs,
    data: paths.templates.data,
    keys: {
      materials: 'materials',
      views: 'views',
      docs: 'docs'
    },
    dest: paths.templates.dest,
    logErrors: paths.dev,
    helpers: handlebarsHelpers
  });
  done();
});

gulp.task('styles', function() {
  return gulp
    .src([paths.styles.src])
    .pipe(plumber())
    .pipe(gulpif(paths.dev, sourcemaps.init()))
    .pipe(
      sass({
        outputStyle: 'expanded',
        includePaths: './node_modules'
      }).on('error', sass.logError)
    )
    .pipe(
      autoprefixer({
        browsers: paths.styles.browsers
      })
    )

    .pipe(gulpif(!paths.dev, cssnano({ autoprefixer: false })))
    .pipe(sourcemaps.write())
    .pipe(
      gulpif(
        !paths.dev,
        rename({
          suffix: '.min'
        })
      )
    )
    .pipe(gulp.dest(paths.styles.dest))
    .pipe(
      gulpif(
        paths.dev,
        reload({
          stream: true
        })
      )
    );
});

//JS Tasks

gulp.task('scripts', function() {
  return gulp
    .src([
      base.src + 'scripts/utils/*.js',
      base.src + 'scripts/common/*.js',
      base.src + 'scripts/pages/*.js',
      base.src + 'scripts/app.js'
    ])
    .pipe(plumber())
    .pipe(concat('main.js'))
    .pipe(gulp.dest(paths.scripts.dest))
    .pipe(
      rename({
        suffix: '.min'
      })
    )
    .pipe(uglify())
    .pipe(gulp.dest(paths.scripts.dest));
});

gulp.task('libs', function() {
  return gulp
    .src(paths.libs.js)
    .pipe(plumber())
    .pipe(concat('libs.js'))
    .pipe(gulp.dest(paths.scripts.dest))
    .pipe(
      rename({
        suffix: '.min'
      })
    )
    .pipe(uglify())
    .pipe(gulp.dest(paths.scripts.dest));
});

// clean up
gulp.task('clean', del.bind(null, ['dist']));

// Copy images
gulp.task('images', function() {
  gulp
    .src(paths.images.src)
    .pipe(plumber())
    .pipe(
      cache(
        imagemin({
          progressive: true,
          interlaced: true
        })
      )
    )
    .pipe(gulp.dest(paths.images.dest));
});

// Copy fonts
gulp.task('copy:fonts', function() {
  gulp.src(paths.fonts).pipe(gulp.dest(paths.dist.fonts));
});

// Copy data
gulp.task('copy:data', function() {
  gulp.src([paths.src.data + '/*.*', paths.src.data + '/**/*.*']).pipe(gulp.dest(paths.dist.data));
});

// Copy content
gulp.task('copy:content', function() {
  gulp.src([paths.src.content + '/*.*', paths.src.content + '/**/*.*']).pipe(gulp.dest(paths.dist.content));
});

// Copy all
gulp.task('copy:all', ['copy:data', 'copy:fonts', 'copy:content']);

gulp.task('json-watch', ['json'], function(done) {
  browserSync.reload();
  done();
});

gulp.task('js-lint', function() {
  return gulp
    .src([paths.scripts.src, '!node_modules/**', '!scripts/vendors/**/*'])
    .pipe(plumber())
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
  // .pipe(jshint.reporter('fail'));
});

gulp.task('sass-lint', function() {
  return gulp
    .src([paths.styles.watch, '!sass/vendors/**/*'])
    .pipe(plumber())
    .pipe(
      gulpStylelint({
        failAfterError: false,
        reporters: [
          {
            formatter: 'verbose',
            console: true
          }
        ],
        debug: true
      })
    );
});

gulp.task('code-lint', function() {
  runSequence(['js-lint', 'sass-lint']);
});

gulp.task('scriptReplace', function() {
  if (paths.dev) {
    gulp
      .src(paths.dist.html + '**/*.html')
      .pipe(plumber())
      .pipe(
        htmlreplace({
          jsLib: '/scripts/libs.js',
          jsMain: '/scripts/main.js',
          css: '/styles/style.css'
        })
      )
      .pipe(gulp.dest(paths.dist.html));
  } else {
    gulp
      .src(paths.dist.html + '**/*.html')
      .pipe(plumber())
      .pipe(
        htmlreplace({
          jsLib: '/scripts/libs.min.js?t=' + Date.now(),
          jsMain: '/scripts/main.min.js?t=' + Date.now(),
          css: '/styles/style.min.css?t=' + Date.now()
        })
      )
      .pipe(gulp.dest(paths.dist.html));
  }
});

// server
gulp.task('serve', function() {
  browserSync.init(null, {
    server: {
      baseDir: 'dist'
    },
    notify: false,
    logPrefix: 'BrowserSync'
  });

  gulp.task('templates:watch', ['templates'], reload);
  gulp.watch(paths.templates.watch, ['templates:watch']);
  gulp.watch(paths.src.json, ['json-watch']);

  gulp.task('styles:watch', ['styles']);
  gulp.watch(paths.styles.watch, ['styles:watch']);

  gulp.task('scripts:watch', ['scripts'], reload);
  gulp.watch(paths.scripts.watch, ['scripts:watch']);

  gulp.task('libs:watch', ['libs'], reload);
  gulp.watch(base.src + 'scripts/vendors/*.*', ['libs:watch']);
  
  gulp.task('data:watch', ['copy:data'], reload);
  gulp.watch(base.src + 'data/*.*', ['data:watch']);
  
  gulp.task('images:watch', ['images'], reload);
  gulp.watch(paths.images.watch, ['images:watch']);
});

gulp.task('default', ['clean'], function() {
  var tasks = ['copy:all', 'libs', 'images', 'scripts', 'styles'];

  // run build
  runSequence('templates', tasks, function() {
    gulp.start('serve');
  });
});

gulp.task('deploybuild', ['clean'], function(cb) {
  runSequence('templates', 'scriptReplace', 'images', 'copy:all', 'libs', 'scripts', 'styles', cb);
});

gulp.task('build-serve', ['deploybuild'], function() {
  gulp.start('serve');
});

gulp.task('build', ['clean'], function() {
  runSequence(['copy:all', 'libs', 'images', 'scripts', 'styles', 'templates', 'scriptReplace']);
});
