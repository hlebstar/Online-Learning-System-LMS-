class Test {
  #id;
  #title;
  #questions;
  #passingScore;
  
  constructor(id, title, questions = [], passingScore = 70) {
    if (!id || !title) {
      throw new Error('ID и название теста обязательны');
    }
    if (!Array.isArray(questions)) {
      throw new Error('Вопросы должны быть массивом');
    }
    
    this.#id = id;
    this.#title = title;
    this.#questions = questions;
    this.#passingScore = passingScore;
  }
  
  getId() { return this.#id; }
  getTitle() { return this.#title; }
  getQuestions() { return [...this.#questions]; }
  getPassingScore() { return this.#passingScore; }
  getTotalQuestions() { return this.#questions.length; }
  
  addQuestion(question) {
    if (!question.text || !question.options || !question.correctAnswer) {
      throw new Error('Некорректный формат вопроса');
    }
    this.#questions.push(question);
  }
  
  validateAnswer(questionIndex, answer) {
    if (questionIndex < 0 || questionIndex >= this.#questions.length) {
      throw new Error('Неверный индекс вопроса');
    }
    const question = this.#questions[questionIndex];
    return question.correctAnswer === answer;
  }
  
  calculateScore(answers) {
    if (!Array.isArray(answers)) {
      throw new Error('Ответы должны быть массивом');
    }
    
    let correctCount = 0;
    for (let i = 0; i < Math.min(answers.length, this.#questions.length); i++) {
      if (this.validateAnswer(i, answers[i])) {
        correctCount++;
      }
    }
    
    const percentage = (correctCount / this.#questions.length) * 100;
    const roundedScore = Math.round(percentage * 100) / 100;
    
    return {
      score: roundedScore,
      correctAnswers: correctCount,
      totalQuestions: this.#questions.length,
      passed: roundedScore >= this.#passingScore
    };
  }
  
  toJSON() {
    return {
      id: this.#id,
      title: this.#title,
      questions: this.#questions.map(q => ({
        text: q.text,
        options: [...q.options]
      })),
      passingScore: this.#passingScore,
      totalQuestions: this.#questions.length
    };
  }
}

module.exports = Test;