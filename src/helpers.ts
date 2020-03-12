export class Helpers {
    // Shamelessly modified from https://stackoverflow.com/questions/19700283/how-to-convert-time-milliseconds-to-hours-min-sec-format-in-javascript
    static msToDuration(ms: number): string {
        let milliseconds = (ms % 1000) / 100,
            seconds = Math.floor((ms / 1000) % 60),
            minutes = Math.floor((ms / (1000 * 60)) % 60),
            hours = Math.floor((ms / (1000 * 60 * 60)) % 24);

        let hoursString = (hours < 10) ? "0" + hours : hours;
        let minutesString = (minutes < 10) ? "0" + minutes : minutes;
        let secondsString = (seconds < 10) ? "0" + seconds : seconds;

        return hoursString + ":" + minutesString + ":" + secondsString + "." + milliseconds;
    }

    static getElapsedTimeSince(date: Date): string {
        let msElapsed: number = +new Date() - +date

        return this.msToDuration(msElapsed);
    }
}