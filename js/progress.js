/* In-memory session/lesson progress boundary; no persistence or analytics. */
(function () {
  class Progress {
    constructor() { this.session = null; }
    startSession(classroom, student) { this.session = { classId: classroom.id, studentId: student.id, completedLessons: [] }; }
    completeLesson(lessonId, summary) {
      if (!this.session || this.session.completedLessons.some((lesson) => lesson.id === lessonId)) return;
      this.session.completedLessons.push({
        id: lessonId,
        activeSeconds: summary.activeSeconds,
        activityDurations: summary.activityDurations
      });
    }
  }

  window.SubDay = window.SubDay || {};
  window.SubDay.Progress = Progress;
}());