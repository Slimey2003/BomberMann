import { expect, it, describe, vi, beforeEach, afterEach } from 'vitest'
import Game from '../objects/Game';
import WallController from '../objects/wall/WallController';
import Wall from '../objects/wall/Wall';
import BreakableWall from '../objects/wall/BreakableWall';
import PlayerController from '../objects/moveable/PlayerController';
import Direction  from '@project/utils/Direction';
import BombController from '../objects/moveable/BombController';
import Bomb from '../objects/moveable/Bombs';
import Vector from '@project/utils/Vector';
import type EffectController from '../objects/effect/EffectController';
import type ExplodeBomb from '../objects/moveable/ExplodeBomb';
import { EffectType } from '@project/utils';

describe("Game", () => {
    let game: Game | undefined;

    beforeEach(() => {
        vi.useFakeTimers({
            toFake: [
                "setTimeout",
                "clearTimeout",
                "setInterval",
                "clearInterval",
                "setImmediate",
                "clearImmediate",
                "Date",
                "performance",
            ],
        });
        game = Game.generateBasisGame();
        game.gameStart();
    });

    afterEach(() => {
        if (!game) {
            throw Error("Game has no Instance");
        }
        game.gameStop();

        // Falls BombController / EffectController eigene Timer besitzen:
        game.getBombController().clearPlacedBombs();
        game.getBombController().clearExplodeBombs();

        vi.clearAllTimers();
        vi.useRealTimers();
        vi.restoreAllMocks();
    });
    it.todo("config", () => {}); //
    it.todo("stats", () => {});
    it.todo("rendering", () => {});
    it("running", () => {
        expect(game?.isRunning()).toBe(true);
    });
    it("ending", () => {
        game?.gameStop();
        expect(game?.isRunning()).toBe(false);
    });
    it("ticks", () => {
        if (!game) return;
        const player = game.getPlayerController().getPlayers()[0];
        game.getPlayerController().setPlayerVelocity(0, Direction.SOUTH);
        vi.advanceTimersByTime(250);
        expect(player.getPosition().getY()).toBe(12);
        vi.advanceTimersByTime(250);
        expect(player.getPosition().getY()).toBe(12);
        vi.advanceTimersByTime(250);
        expect(player.getPosition().getY()).toBe(14);
    });

    describe("EffectController", () => {
        let controller: EffectController | undefined;
        beforeEach(() => {
            controller = game?.getEffectController();
        })

        it("placeEffect", () => {
            if(!game) return;
            if (!controller) return;
            controller.placeEffect(new Vector(10, 10), EffectType.SPEED);
            expect(controller.getEffects().length).toBe(1);
        })
    });
    
    describe("WallController", () => {
        let controller: WallController | undefined;
        beforeEach(() => {
            controller = game?.getWallController();
            expect(controller).toBeInstanceOf(WallController);
        });
        it("existed Walls", () => {
            if (!controller) return;
            
            const wallsArray = Array.from(controller.getWalls().values());
            
            const hasNormalWall = wallsArray.some(
                (wall) => wall instanceof Wall && !(wall instanceof BreakableWall)
            );
            expect(hasNormalWall).toBe(true);
        });
        it("existed Breakable Wall", () => {
            if (!controller) return;
            
            const wallsArray = Array.from(controller.getWalls().values());
            
            const hasNormalWall = wallsArray.some(
                (wall) => wall instanceof BreakableWall
            );
            expect(hasNormalWall).toBe(true);
        });
    });

    describe("PlayerController", () => {
        let controller: PlayerController | undefined;
        beforeEach(() => {
            controller = game?.getPlayerController();
            expect(controller).toBeInstanceOf(PlayerController);
        });
        it("Movement", () => {
            if (!controller) return;
            controller.setPlayerVelocity(0, Direction.SOUTH);
            const player = controller.getPlayers()[0];
            expect(player.getMovement().getY()).toBeGreaterThanOrEqual(1);
            expect(player.getMovement().getX()).toEqual(0);
            
            controller.setPlayerVelocity(0, Direction.EAST);
            expect(player.getMovement().getY()).toEqual(0);
            expect(player.getMovement().getX()).toBeGreaterThanOrEqual(1);
        });
        describe("Collision", () => {
            it("Collision with Wall", () => {
                if (!controller) return;
                //SAVE CHECK 
                //Simulate GameTicks, who player change the Direction
                controller.setPlayerVelocity(0, Direction.NORTH);
                const player = controller.getPlayers()[0];
                controller.updateMovement();
                controller.updateMovement();
                controller.setPlayerVelocity(0, Direction.EAST);
                controller.updateMovement();
                controller.updateMovement();
                controller.setPlayerVelocity(0, Direction.SOUTH);
                controller.updateMovement();
                controller.updateMovement();
                controller.updateMovement();
                controller.updateMovement();
                expect(game?.getWallController().overlapsMoveableWithWall(player.getBox())).toBeUndefined();
            });
        })
        describe("Effects", () => {
            it("pick Effect", () => {
                if (!controller) return;
                const player = controller.getPlayers()[0];
                player.setPosition(new Vector(10, 10));
                controller.getEffectController().placeEffect(new Vector(10, 10), EffectType.SPEED);
                
                controller.setPlayerVelocity(0, Direction.SOUTH);
                controller.updateMovement();
                const eff = player.getEffect(EffectType.SPEED);
                expect(eff).not.toBe(undefined)
                controller.setPlayerVelocity(0, Direction.NONE);
                player.clearEffects();
            });
            it("Can used it", () => {
                if (!controller) return;
                const player = controller.getPlayers()[0];
                player.addEffectOrChange(EffectType.SPEED);
                controller.setPlayerVelocity(0, Direction.SOUTH);
                expect(player.getMovement().getY()).toBe(4);
                controller.setPlayerVelocity(0, Direction.NONE);
                player.clearEffects();
            });
        })
        
        it("Player Lost Life", () => {
            if (!controller) return;
            const player = controller.getPlayers()[0];
            expect(player.getLives()).toBe(3);
            const bomb: Bomb = new Bomb(0, player.getPosition());
            const explode = controller.getBombController().modifyBomb(bomb);
            controller.playerTakeDamage(bomb.getPosition(), explode.getCalculatedRange());
            expect(player.getLives()).toBe(2);
        });
        
        it("Player Dead", () => {
            if (!controller) return;
            const player = controller.getPlayers()[0];
            expect(player.getLives()).toBe(3);
            const bomb: Bomb = new Bomb(0, player.getPosition());
            const explode = controller.getBombController().modifyBomb(bomb);
            controller.playerTakeDamage(bomb.getPosition(), explode.getCalculatedRange());
            controller.playerTakeDamage(bomb.getPosition(), explode.getCalculatedRange());
            controller.playerTakeDamage(bomb.getPosition(), explode.getCalculatedRange());
            expect(player.getLives()).toBe(0);
            expect(player.isDead()).toBe(true);
        });
    });

    describe("BombController", () => {
        let controller: BombController | undefined;
        beforeEach(() => {
            controller = game?.getBombController();
            expect(controller).toBeInstanceOf(BombController);
            
        });
        describe("Placed", () => {
            it("Placed normal", () => {
                if (!controller) return;
                controller.placeBomb(0);
                expect(controller.getPlacedBombs().length).toBe(1);
                controller.clearPlacedBombs();
            });
            it("Placed on BOM", () => {
                if (!controller) return;
                controller.placeBomb(0);
                expect(controller.getPlacedBombs().length).toBe(1);
                controller.placeBomb(0);
                expect(controller.getPlacedBombs().length).toBe(1);
                controller.clearPlacedBombs();
            });
        });
        it("Movement", () => {
            if (!controller) return;
            controller.getPlayerController().setPlayerVelocity(0, Direction.SOUTH);
            const player = controller.getPlayerController().getPlayers()[0];
            player.setPosition(new Vector(10, 10));
            controller.placeBomb(0);
            const bomb = controller.getPlacedBombs()[0];
            const posBefore = bomb.getPosition();
            expect(bomb.getMovement().getY()).toEqual(0);
            controller.playerCollidedWithBomb(true);
            expect(bomb.getMovement().getY()).toBe(40);
            controller.updateMovement();
            expect(bomb.getMovement().getY()).toBe(0);
            expect(bomb.getPosition()).not.equal(posBefore);
            controller.clearPlacedBombs();
        });
        describe("Collision", () => {
            it("Collision with Wall", () => {
                //I mean is the same logic with Player Collision with Wall
            });
            it("Collision with Player", () => {
                if (!controller) return;
                controller.placeBomb(0);
                const bomb = controller.getPlacedBombs()[0];
                expect(bomb.getMovement().getY()).toEqual(0);
                controller.getPlayerController().setPlayerVelocity(0, Direction.SOUTH);
                controller.playerCollidedWithBomb(true);
                expect(bomb.getMovement().getY()).toBe(40);
                controller.clearPlacedBombs();
            });
        })
        describe("Effects", () => {
            it("Can used it", () => {
                if (!controller) return;
                const bomb: Bomb = new Bomb(0, new Vector(20, 10));
                const player = controller.getPlayerController().getPlayers()[0];
                player.addEffectOrChange(EffectType.RANGE);
                player.addEffectOrChange(EffectType.STRANGE);
                const explode: ExplodeBomb = controller.modifyBomb(bomb);
                expect(explode.getRange()).toBe(60);
                expect(explode.getStrange()).toBe(3);

            });
        })
        describe("Exposition", () => {
            it("Explode After Time", () => {
                if (!controller) return;
                //Trigger One Bomb
                const player = controller.getPlayerController().getPlayers()[0];
                player.setPosition(new Vector(10, 10));
                controller.placeBomb(0);
                expect(controller.triggerExplosion().length).toBe(0);
                vi.advanceTimersByTime(7999);
                expect(controller.triggerExplosion().length).toBe(0);
                vi.advanceTimersByTime(2);
                expect(controller.triggerExplosion().length).toBe(1);

                //Trigger Two Bomb
                controller.placeBomb(0);
                player.setPosition(new Vector(10, 20));
                vi.advanceTimersByTime(5);
                controller.placeBomb(0);
                expect(controller.triggerExplosion().length).toBe(0);
                vi.advanceTimersByTime(7994);
                expect(controller.triggerExplosion().length).toBe(0);
                vi.advanceTimersByTime(1);
                expect(controller.triggerExplosion().length).toBe(2);
                controller.clearPlacedBombs();
            })
            it("Chan Reaction", () => {
                if (!controller) return;
                const bomb: Bomb = new Bomb(0, new Vector(20, 10));
                const bomb1: Bomb = new Bomb(0, new Vector(10, 10));
                controller.clearPlacedBombs();
                controller.addBomb(bomb1);
                const triggers = [ controller.modifyBomb(bomb)];
                expect(triggers.length).toBe(1);
                controller.triggerOtherBomb(triggers);
                expect(triggers.length).toBe(2);
                controller.clearPlacedBombs();
            });
        });
    });
})

