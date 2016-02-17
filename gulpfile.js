'use strict'

const gulp    = require('gulp')
const rename  = require('gulp-rename')
const rimraf  = require('gulp-rimraf')
const notify  = require('gulp-notify')
const tsc     = require('gulp-typescript')
const mocha   = require('gulp-mocha')
const args    = require('yargs').argv
const project = tsc.createProject('tsconfig.json')

gulp.task('clean', () => {
  return gulp.src(['dist', 'lib', 'coverage'], { read: false })
    .pipe(rimraf())
})

// ----------------------------------------------------------------------------

gulp.task('build', ['clean'], () => {
  return project.src()
    .pipe(tsc(project))
    .on('error', onError)
    .pipe(gulp.dest('dist'))
})

gulp.task('test', (done) => {
  return gulp.src('dist/test/**/*.js', { read: false })
    .pipe(mocha({
      reporter: 'spec',
      bail: !!args.bail,
    }))
    .on('error', onError)
})

gulp.task('package', ['build', 'test'], () => {
  return gulp.src('dist/src/reselect.js')
    .pipe(rename('index.js'))
    .pipe(gulp.dest('lib'))
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
