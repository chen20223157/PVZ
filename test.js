// 测试所有模块是否能正常导入
console.log('测试开始...');

try {
  console.log('正在导入 Game...');
  const { Game } = await import('./Game.js');
  console.log('✓ Game 模块导入成功');

  console.log('正在创建 Canvas...');
  const canvas = {
    width: 900,
    height: 600,
    getBoundingClientRect: () => ({ left: 0, top: 0 })
  };

  console.log('正在创建 Game 实例...');
  const game = new Game(canvas);
  console.log('✓ Game 实例创建成功');
  console.log('游戏状态:', game.state);
  console.log('✓ 所有测试通过！');
} catch (error) {
  console.error('✗ 错误:', error.message);
  console.error('堆栈:', error.stack);
}