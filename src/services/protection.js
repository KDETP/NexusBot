class Protection {

    constructor() {

        this.panic = false;

        this.strictSpam = false;

        this.blockLinks = false;

        this.blockInvites = false;

        this.blockEveryone = false;

    }

    enablePanic() {

        this.panic = true;

        this.strictSpam = true;

        this.blockLinks = true;

        this.blockInvites = true;

        this.blockEveryone = true;

    }

    disablePanic() {

        this.panic = false;

        this.strictSpam = false;

        this.blockLinks = false;

        this.blockInvites = false;

        this.blockEveryone = false;

    }

}

module.exports = new Protection();