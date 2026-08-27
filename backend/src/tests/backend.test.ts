import { before } from 'node:test';
import { expect, it, describe } from 'vitest'
import Game from '../objects/Game';
import WallController from '../objects/wall/WallController';
import Wall from '../objects/wall/Wall';
import BreakableWall from '../objects/wall/BreakableWall';
import PlayerController from '../objects/moveable/PlayerController';
import { Direction } from '../objects/utils/Direction';
import BombController from '../objects/moveable/BombController';
import Bomb from '../objects/moveable/Bombs';
import Vector from '../objects/utils/Vector';
import type EffectController from '../objects/effect/EffectController';
import Effect from '../objects/effect/Effect';
import type ExplodeBomb from '../objects/moveable/ExplodeBomb';

describe("Game", () => {
    let game: Game | undefined;
    before(() => {
        game = new Game(["player1", "player2"], 19, 15);
    });

    it.todo("config", () => {});
    it.todo("running", () => {});
    it.todo("ending", () => {});
    it.todo("stats", () => {});
    it.todo("ticks", () => {});

    describe("EffectController", () => {
        let controller: EffectController | undefined;
        before(() => {
            controller = game?.getEffectController();
        })

        it("placeEffect", () => {
            if(!game) return;
            if (!controller) return;
            controller.placeEffect(new Vector(10, 10), Effect.SPEED);
            expect(controller.getEffects().length).toBe(1);
        })
    });
    
    describe("WallController", () => {
        let controller: WallController | undefined;
        before(() => {
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
        before(() => {
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
                
                controller.setPlayerVelocity(0, Direction.SOUTH);
                controller.updateMovement();
                const eff = player.getEffect(Effect.SPEED);
                expect(eff).not.toBe(undefined)
                controller.setPlayerVelocity(0, Direction.NONE);
                player.clearEffects();
            });
            it("Can used it", () => {
                if (!controller) return;
                const player = controller.getPlayers()[0];
                player.addEffectOrChange(Effect.SPEED);
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
            expect(player.getLives()).toBe(2);
            const bomb: Bomb = new Bomb(0, player.getPosition());
            const explode = controller.getBombController().modifyBomb(bomb);
            controller.playerTakeDamage(bomb.getPosition(), explode.getCalculatedRange());
            controller.playerTakeDamage(bomb.getPosition(), explode.getCalculatedRange());
            expect(player.getLives()).toBe(0);
            expect(player.isDead()).toBe(true);
        });
    });

    describe("BombController", () => {
        let controller: BombController | undefined;
        before(() => {
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
            it.todo("Collision with Wall", () => {
                //I mean is the same logic with Player Collision with Wall
            });
            it("Collision with Player", () => {
                //Gehört wohl doch hier hin da ich das Place und playerCollidedWithBomb im BombController hab nicht in Player ;D
                if (!controller) return;
                controller.placeBomb(0);
                const bomb = controller.getPlacedBombs()[0];
                expect(bomb.getMovement().getY()).toEqual(0);
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
                player.addEffectOrChange(Effect.RANGE);
                player.addEffectOrChange(Effect.STRANGE);
                const explode: ExplodeBomb = controller.modifyBomb(bomb);
                expect(explode.getRange()).toBe(60);
                expect(explode.getStrange()).toBe(3);

            });
        })
        describe("Exposition", () => {
            it("Chan Reaction", () => {
                if (!controller) return;
                const bomb: Bomb = new Bomb(0, new Vector(20, 10));
                const bomb1: Bomb = new Bomb(0, new Vector(10, 10));
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

