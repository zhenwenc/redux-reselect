'use strict'

const gulp   = require('gulp')
const rimraf = require('gulp-rimraf')
const notify = require('gulp-notify')
const tsc    = require('gulp-typescript')
const mocha  = require('gulp-mocha')
const args   = require('yargs').argv

gulp.task('clean', () => {
  return gulp.src(['dist', 'lib', 'coverage'], { read: false })
    .pipe(rimraf())
})

// ----------------------------------------------------------------------------

gulp.task('build:lib', () => {
  return gulp.src('src/**/*.ts')
    .pipe(tsc({
      target: 'es6',
      module: 'commonjs',
      removeComments: true,
      preserveConstEnums: true,
      sourceMap: false,
      noExternalResolve: true,
      out: 'index.js'
    }))
    .on('error', onError)
    .pipe(gulp.dest('lib'))
})

gulp.task('build:test', () => {
  return gulp.src('test/**/*.ts')
    .pipe(tsc({
      target: 'es6',
      module: 'commonjs',
      removeComments: true,
      preserveConstEnums: true,
      sourceMap: false,
      noExternalResolve: true
    }))
    .on('error', onError)
    .pipe(gulp.dest('dist/test'))
})

gulp.task('build', ['clean', 'build:lib'])

gulp.task('test', (done) => {
  return gulp.src('dist/test/**/*.js', { read: false })
    .pipe(mocha({
      reporter: 'spec',
      globals: {
        should: require('should')
      },
      bail: !!args.bail,
    }))
    .on('error', onError)
})

// ----------------------------------------------------------------------------

gulp.task('watch:build', ['build'], () => {
  gulp.watch(['src/**/*.{ts}'], ['build'])
})

gulp.task('watch:test', ['test'], () => {
  gulp.watch(['lib/**', 'dist/test/**'], ['test'])
})

gulp.task('watch', ['watch:build', 'watch:test'])

// ----------------------------------------------------------------------------

function onError(error) {
  notify.onError({
    title: error.name || 'Error',
    message: error.message || error || '',
  })
  console.log(error.stack)
  this.emit('end')
}
