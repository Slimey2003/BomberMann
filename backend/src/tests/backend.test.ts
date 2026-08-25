import { expect, it, describe } from 'vitest'

describe("Game", () => {
    it.todo("config", () => {});
    it.todo("running", () => {});
    it.todo("ending", () => {});
    it.todo("stats", () => {});
    it.todo("ticks", () => {});
})

describe("GameField", () => {
    it.todo("Wall", () => {});
    it.todo("Breakable Wall", () => {});
    it.todo("Timer", () => {});
});

describe("Player", () => {
    it.todo("Movement", () => {});
    describe("Collision", () => {
        it.todo("Collision with Wall", () => {});
        it.todo("Collision with BOM", () => {});
    })
    describe("Effects", () => {
        it.todo("Has Effects", () => {});
        it.todo("Can used it", () => {});
    })
    it.todo("Lost Life", () => {});
    it.todo("Dead", () => {});
});

describe("BOM", () => {
    describe("Placed", () => {
        it.todo("Placed normal", () => {});
        it.todo("Placed on BOM", () => {});
    });
    it.todo("Movement", () => {});
    describe("Collision", () => {
        it.todo("Collision with Wall", () => {});
        it.todo("Collision with BOM", () => {});
    })
    describe("Effects", () => {
        it.todo("Has Effects", () => {});
        it.todo("Can used it", () => {});
    })
    describe("Exposition", () => {
        it.todo("PUFF after place", () => {});
        it.todo("Chan Reaction", () => {});
    });
});