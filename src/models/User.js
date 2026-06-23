class User {
  #id;
  #name;
  #email;
  #role;
  
  constructor(id, name, email, role) {
    if (!id || !name || !email) {
      throw new Error('ID, имя и email обязательны');
    }
    this.#id = id;
    this.#name = name;
    this.#email = email;
    this.#role = role || 'student';
  }
  
  getId() { return this.#id; }
  getName() { return this.#name; }
  getEmail() { return this.#email; }
  getRole() { return this.#role; }
  
  isStudent() { return this.#role === 'student'; }
  isTeacher() { return this.#role === 'teacher'; }
  isAdmin() { return this.#role === 'admin'; }
  
  toJSON() {
    return { id: this.#id, name: this.#name, email: this.#email, role: this.#role };
  }
}

module.exports = User;