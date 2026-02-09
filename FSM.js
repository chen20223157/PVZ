/**
 * 有限状态机 (FSM) 系统
 * 用于管理僵尸的复杂状态逻辑
 */

/**
 * 状态基类
 */
export class State {
  constructor(name) {
    this.name = name;
  }

  /**
   * 进入状态时调用
   */
  enter(entity) {
    // 子类可覆盖
  }

  /**
   * 更新状态
   */
  update(entity, deltaTime) {
    // 子类可覆盖
  }

  /**
   * 退出状态时调用
   */
  exit(entity) {
    // 子类可覆盖
  }
}

/**
 * 行走状态 - 僵尸向左移动
 */
export class WalkingState extends State {
  constructor() {
    super('walking');
  }

  enter(entity) {
    entity.animation = 'walking';
  }

  update(entity, deltaTime) {
    // 向左移动
    entity.x -= entity.speed * deltaTime;

    // 检测是否需要攻击（前方有植物）
    if (entity.shouldAttack()) {
      entity.changeState(new AttackingState());
    }

    // 检查是否到达房子（游戏结束）
    if (entity.x < 0) {
      entity.gameOver = true;
    }
  }
}

/**
 * 攻击状态 - 僵尸啃咬植物
 */
export class AttackingState extends State {
  constructor() {
    super('attacking');
    this.attackTimer = 0;
  }

  enter(entity) {
    entity.animation = 'attacking';
    this.attackTimer = 0;
  }

  update(entity, deltaTime) {
    this.attackTimer += deltaTime;

    // 检查目标是否还存在
    if (!entity.shouldAttack()) {
      entity.changeState(new WalkingState());
      return;
    }

    // 执行攻击
    if (this.attackTimer >= entity.attackSpeed) {
      this.attackTimer = 0;
      entity.attackTargetPlant();
    }
  }
}

/**
 * 死亡状态 - 僵尸正在死亡
 */
export class DyingState extends State {
  constructor() {
    super('dying');
    this.deathTimer = 0;
    this.deathDuration = 500; // 死亡动画时长（毫秒）
  }

  enter(entity) {
    entity.animation = 'dying';
    this.deathTimer = 0;
    // 触发死亡粒子效果
    entity.spawnDeathParticles();
  }

  update(entity, deltaTime) {
    this.deathTimer += deltaTime;

    // 死亡动画完成，标记为可删除
    if (this.deathTimer >= this.deathDuration) {
      entity.isDead = true;
    }
  }
}

/**
 * 冰冻状态 - 被寒冰射手减速
 */
export class FrozenState extends State {
  constructor(previousState) {
    super('frozen');
    this.previousState = previousState; // 保存之前的状态
    this.frozenTimer = 0;
    this.frozenDuration = 3000; // 冰冻持续时间
    this.slowFactor = 0.5; // 减速50%
  }

  enter(entity) {
    entity.animation = 'frozen';
    this.frozenTimer = 0;
    // 应用减速效果
    entity.originalSpeed = entity.speed;
    entity.speed *= this.slowFactor;
  }

  update(entity, deltaTime) {
    this.frozenTimer += deltaTime;

    // 执行之前状态的逻辑，但速度减慢
    if (this.previousState) {
      this.previousState.update(entity, deltaTime);
    }

    // 冰冻时间结束，恢复原状态
    if (this.frozenTimer >= this.frozenDuration) {
      entity.speed = entity.originalSpeed;
      entity.changeState(this.previousState || new WalkingState());
    }
  }

  exit(entity) {
    // 恢复原速度
    if (entity.originalSpeed) {
      entity.speed = entity.originalSpeed;
    }
  }
}

/**
 * 状态机
 */
export class StateMachine {
  constructor() {
    this.currentState = null;
    this.previousState = null;
  }

  /**
   * 更改状态
   */
  changeState(newState, entity) {
    if (this.currentState) {
      this.currentState.exit(entity);
    }

    this.previousState = this.currentState;
    this.currentState = newState;

    if (this.currentState) {
      this.currentState.enter(entity);
    }
  }

  /**
   * 更新当前状态
   */
  update(entity, deltaTime) {
    if (this.currentState) {
      this.currentState.update(entity, deltaTime);
    }
  }

  /**
   * 获取当前状态名称
   */
  getCurrentStateName() {
    return this.currentState ? this.currentState.name : 'none';
  }

  /**
   * 回退到上一个状态
   */
  revert(entity) {
    if (this.previousState) {
      this.changeState(this.previousState, entity);
    }
  }
}
