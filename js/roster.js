/* Small roster access layer so student selection is not coupled to roster storage. */
(function () {
  class Roster {
    constructor(classes) { this.classes = classes || []; }
    getClasses() { return this.classes; }
    getStudents(classId) {
      const classroom = this.classes.find((item) => item.id === classId);
      return classroom ? classroom.students : [];
    }
  }

  window.SubDay = window.SubDay || {};
  window.SubDay.Roster = Roster;
}());