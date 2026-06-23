class Lesson {
  #id;
  #title;
  #content;
  #duration;
  #orderNumber;
  
  constructor(id, title, content, duration, orderNumber) {
    if (!id || !title) {
      throw new Error('ID и название урока обязательны');
    }
    this.#id = id;
    this.#title = title;
    this.#content = content || '';
    this.#duration = duration || 0;
    this.#orderNumber = orderNumber || 0;
  }
  
  getId() { return this.#id; }
  getTitle() { return this.#title; }
  getContent() { return this.#content; }
  getDuration() { return this.#duration; }
  getOrderNumber() { return this.#orderNumber; }
  
  getFormattedDuration() {
    const hours = Math.floor(this.#duration / 60);
    const minutes = this.#duration % 60;
    if (hours > 0) return `${hours} ч ${minutes} мин`;
    return `${minutes} мин`;
  }
  
  toJSON() {
    return {
      id: this.#id,
      title: this.#title,
      content: this.#content,
      duration: this.#duration,
      durationFormatted: this.getFormattedDuration(),
      orderNumber: this.#orderNumber
    };
  }
}

module.exports = Lesson;