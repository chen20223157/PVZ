// 检查所有模块的导入关系
console.log('🔍 开始检查模块导入关系...');

async function checkModule(name, path) {
    try {
        const module = await import(path);
        console.log(`✅ ${name} 导入成功`);
        return true;
    } catch (error) {
        console.error(`❌ ${name} 导入失败:`, error.message);
        return false;
    }
}

// 检查所有模块
const modules = [
    { name: 'Config', path: './config.js' },
    { name: 'Grid', path: './Grid.js' },
    { name: 'Plant', path: './Plant.js' },
    { name: 'Zombie', path: './Zombie.js' },
    { name: 'BulletManager', path: './Bullet.js' },
    { name: 'ParticleSystem', path: './ParticleSystem.js' },
    { name: 'SunManager', path: './Sun.js' },
    { name: 'LoginScreen', path: './LoginScreen.js' },
    { name: 'PlantEditor', path: './PlantEditor.js' },
    { name: 'PlantTemplates', path: './PlantTemplates.js' },
    { name: 'ObjectPool', path: './ObjectPool.js' }
];

async function main() {
    const results = {};

    for (const module of modules) {
        results[module.name] = await checkModule(module.name, module.path);
    }

    console.log('\n📊 导入检查结果:');
    const success = Object.values(results).every(result => result);

    if (success) {
        console.log('🎉 所有模块导入成功！可以创建游戏实例了。');
    } else {
        console.log('⚠️  有模块导入失败，请检查上述错误。');
    }
}

main().catch(console.error);