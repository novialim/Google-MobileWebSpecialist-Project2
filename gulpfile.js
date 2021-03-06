// generated on 2018-08-31 using generator-webapp 3.0.1
const gulp = require('gulp')
const gulpLoadPlugins = require('gulp-load-plugins')
const browserSync = require('browser-sync').create()
const del = require('del')
const wiredep = require('wiredep').stream
const runSequence = require('run-sequence')
const babelify = require('babelify')
const browserify = require('browserify')
const source = require('vinyl-source-stream')
const buffer = require('vinyl-buffer')
var webpack = require('gulp-webpack')
var named = require('vinyl-named')
var fs = require('fs')
var replace = require('gulp-replace')

const $ = gulpLoadPlugins()
const reload = browserSync.reload

let dev = true

gulp.task('dbhelper', () => {
  const browse = browserify({
    debug: true
  })

  return browse
    .transform(babelify)
    .require('app/js/dbhelper.js', { entry: true })
    .bundle()
    .pipe(source('dbhelper.js'))
    .pipe(gulp.dest('.tmp/js/'))
})

gulp.task('styles', () => {
  return gulp.src('app/styles/*.scss')
    .pipe($.plumber())
    .pipe($.if(dev, $.sourcemaps.init()))
    .pipe($.sass.sync({
      outputStyle: 'expanded',
      precision: 10,
      includePaths: ['.']
    }).on('error', $.sass.logError))
    .pipe($.autoprefixer({ browsers: ['> 1%', 'last 2 versions', 'Firefox ESR'] }))
    .pipe($.if(dev, $.sourcemaps.write()))
    .pipe(gulp.dest('.tmp/styles'))
    .pipe(reload({ stream: true }))
})

gulp.task('scripts', () => {
  return gulp.src('app/scripts/**/*.js')
    .pipe($.plumber())
    .pipe($.if(dev, $.sourcemaps.init()))
    .pipe($.babel())
    .pipe($.if(dev, $.sourcemaps.write('.')))
    .pipe(gulp.dest('.tmp/scripts'))
    .pipe(reload({ stream: true }))
})

gulp.task('js', () => {
  return gulp
    .src(['app/js/**/*.js', '!app/js/**/dbhelper.js'])
    .pipe($.plumber())
    .pipe($.if(dev, $.sourcemaps.init()))
    .pipe($.babel())
    .pipe($.if(dev, $.sourcemaps.write('.')))
    .pipe(gulp.dest('.tmp/js'))
    .pipe(reload({ stream: true }))
})

gulp.task('sw', () => {
  const browse = browserify({
    debug: true
  })

  return browse
    .transform(babelify.configure({
      presets: ['es2015']
    }))
    .transform(babelify)
    .require('app/sw.js', { entry: true })
    .bundle()
    .pipe(source('sw.js'))
    .pipe(gulp.dest('.tmp/'))
})

gulp.task('main', function () {

  return browserify({
    entries: ['./app/js/main.js']
  })
    .transform(babelify.configure({
      presets: ['@babel/preset-env']
    }))
    .bundle()
    .pipe(source('main.js'))
    .pipe(buffer())
    .pipe(gulp.dest('./dist/js'))
})

gulp.task('db', function () {

  return browserify({
    entries: ['./app/sw.js']
  })
    .transform(babelify.configure({
      presets: ['@babel/preset-env']
    }))
    .bundle()
    .pipe(source('sw.js'))
    .pipe(buffer())
    .pipe(gulp.dest('./dist'))
})

function lint(files) {
  return gulp.src(files)
    .pipe($.eslint({ fix: true }))
    .pipe(reload({ stream: true, once: true }))
    .pipe($.eslint.format())
    .pipe($.if(!browserSync.active, $.eslint.failAfterError()))
}

gulp.task('lint', () => {
  return lint('app/scripts/**/*.js')
    .pipe(gulp.dest('app/scripts'))
})
gulp.task('lint:test', () => {
  return lint('test/spec/**/*.js')
    .pipe(gulp.dest('test/spec'))
})

gulp.task('html', ['styles', 'scripts'], () => {
  return gulp.src('app/*.html')
    .pipe($.useref({ searchPath: ['.tmp', 'app', '.'] }))
    .pipe($.if(/\.js$/, $.uglify({ compress: { drop_console: true } })))
    .pipe($.if(/\.css$/, $.cssnano({ safe: true, autoprefixer: false })))
    .pipe($.if(/\.html$/, $.htmlmin({
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: { compress: { drop_console: true } },
      processConditionalComments: true,
      removeComments: true,
      removeEmptyAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true
    })))
    .pipe(gulp.dest('dist'))
})

gulp.task('images', () => {
  return gulp.src('app/images/**/*')
    .pipe($.cache($.imagemin()))
    .pipe(gulp.dest('dist/images'))
})

gulp.task('fonts', () => {
  return gulp.src(require('main-bower-files')('**/*.{eot,svg,ttf,woff,woff2}', function (err) {
  })
    .concat('app/fonts/**/*'))
    .pipe($.if(dev, gulp.dest('.tmp/fonts'), gulp.dest('dist/fonts')))
})

gulp.task('extras', () => {
  return gulp.src([
    'app/*',
    '!app/*.html'
  ], {
    dot: true
  }).pipe(gulp.dest('dist'))
})

gulp.task('clean', del.bind(null, ['.tmp', 'dist']))

gulp.task('serveinfo', () => {
  return gulp
    .src('app/restaurant.html')
    .pipe(
      replace('<!-- JS Placeholder -->', function (s) {
        var script =
          fs.readFileSync('app/js/register.js', 'utf8') +
          fs.readFileSync('app/js/dbhelper.js', 'utf8') +
          fs.readFileSync('app/js/restaurant_info.js')
        return '<script>' + script + '</script>'
      })
    )
    .pipe(gulp.dest('.tmp/'))
})

gulp.task('serve', () => {
  runSequence(['clean', 'wiredep'], ['html', 'js', 'dbhelper', 'styles', 'sw', 'fonts'], () => {
    browserSync.init({
      notify: false,
      port: 9000,
      server: {
        baseDir: ['.tmp', 'app'],
        routes: {
          '/bower_components': 'bower_components'
        }
      }
    })

    gulp.watch([
      'app/*.html',
      'app/images/**/*',
      '.tmp/fonts/**/*'
    ]).on('change', reload)

    gulp.watch('app/styles/**/*.scss', ['styles'])
    gulp.watch('app/sw.js', ['sw'])
    gulp.watch('app/scripts/**/*.js', ['scripts'])
    gulp.watch('app/fonts/**/*', ['fonts'])
    gulp.watch('bower.json', ['wiredep', 'fonts'])
  })
})

gulp.task('serve:dist', ['default'], () => {
  browserSync.init({
    notify: false,
    port: 9000,
    server: {
      baseDir: ['dist']
    }
  })
})

gulp.task('serve:test', ['scripts'], () => {
  browserSync.init({
    notify: false,
    port: 9000,
    ui: false,
    server: {
      baseDir: 'test',
      routes: {
        '/scripts': '.tmp/scripts',
        '/bower_components': 'bower_components'
      }
    }
  })

  gulp.watch('app/scripts/**/*.js', ['scripts'])
  gulp.watch(['test/spec/**/*.js', 'test/index.html']).on('change', reload)
  gulp.watch('test/spec/**/*.js', ['lint:test'])
})

// inject bower components
gulp.task('wiredep', () => {
  gulp.src('app/styles/*.scss')
    .pipe($.filter(file => file.stat && file.stat.size))
    .pipe(wiredep({
      ignorePath: /^(\.\.\/)+/
    }))
    .pipe(gulp.dest('app/styles'))

  gulp.src('app/*.html')
    .pipe(wiredep({
      exclude: ['bootstrap-sass'],
      ignorePath: /^(\.\.\/)*\.\./
    }))
    .pipe(gulp.dest('app'))
})

gulp.task('build', ['lint', 'html', 'images', 'fonts', 'extras'], () => {
  return gulp.src('dist/**/*').pipe($.size({ title: 'build', gzip: true }))
})

gulp.task('default', () => {
  return new Promise(resolve => {
    dev = false
    runSequence(['clean', 'wiredep'], 'build', resolve)
  })
})

gulp.task('dev', function () {
  return gulp.src('app/js/main.js')
    .pipe(named())
    .pipe(webpack({
      watch: true,
      module: {
        loaders: [
          {
            test: /\.jsx?$/,
            exclude: /node_modules/,
            loader: 'babel',
            query: {
              presets: ['react', 'es2015']
            }
          }
        ]
      },
      output: {
        filename: '[name].jsx'
      },
      resolve: {
        alias: { localforage: 'localforage/dist/localforage.min' }
      }
    }))
    .pipe(gulp.dest('app/dist/'))
})
