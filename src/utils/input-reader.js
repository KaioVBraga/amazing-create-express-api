const readline = require("readline");

module.exports = class InputReader {
  r1 = null;

  static open() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  static async question(message) {
    return new Promise((resolve) => {
      this.rl.question(message, (userResponse) => resolve(userResponse));
    });
  }

  static close() {
    if (!this.rl) {
      return;
    }

    this.rl.close();

    this.rl.on("close", () => {
      this.rl = null;
    });
  }
};
