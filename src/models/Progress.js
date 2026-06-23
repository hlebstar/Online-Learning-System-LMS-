class Progress {
  #userId;
  #courseId;
  #completedLessons;
  #totalLessons;
  #testScores;
  #status;
  
  constructor(userId, courseId, totalLessons = 0) {
    if (!userId || !courseId) {
      throw new Error('userId и courseId обязательны');
    }
    this.#userId = userId;
    this.#courseId = courseId;
    this.#completedLessons = 0;
    this.#totalLessons = totalLessons;
    this.#testScores = [];
    this.#status = 'in_progress';
  }
  
  getUserId() { return this.#userId; }
  getCourseId() { return this.#courseId; }
  getCompletedLessons() { return this.#completedLessons; }
  getTotalLessons() { return this.#totalLessons; }
  getStatus() { return this.#status; }
  getAverageScore() {
    if (this.#testScores.length === 0) return 0;
    const sum = this.#testScores.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.#testScores.length);
  }
  
  completeLesson(lessonId) {
    if (this.#completedLessons < this.#totalLessons) {
      this.#completedLessons++;
    }
    if (this.#completedLessons === this.#totalLessons && this.getAverageScore() >= 70) {
      this.#status = 'completed';
    }
  }
  
  addTestScore(score) {
    if (typeof score !== 'number' || score < 0 || score > 100) {
      throw new Error('Оценка должна быть числом от 0 до 100');
    }
    this.#testScores.push(score);
    if (this.#completedLessons === this.#totalLessons && this.getAverageScore() >= 70) {
      this.#status = 'completed';
    }
  }
  
  getProgressPercentage() {
    if (this.#totalLessons === 0) return 0;
    return (this.#completedLessons / this.#totalLessons) * 100;
  }
  
  toJSON() {
    return {
      userId: this.#userId,
      courseId: this.#courseId,
      completedLessons: this.#completedLessons,
      totalLessons: this.#totalLessons,
      progressPercent: this.getProgressPercentage(),
      averageScore: this.getAverageScore(),
      status: this.#status
    };
  }
}

module.exports = Progress;