# 联调启动流程

## 前置条件

- Node.js 18+
- MySQL 8.x 运行中
- Geth Dev 开发链运行中 (端口 8545)
- MetaMask 浏览器插件已安装

## 第一步：启动 Geth Dev 链

```bash
geth --dev --http --http.addr "0.0.0.0" --http.port 8545 --http.corsdomain "*" --http.api "eth,net,web3,personal,miner,txpool,debug" --allow-insecure-unlock --dev.period 1
```

> 注意：`--dev.period 1` 让区块每秒自动出块，确保交易即时确认。

## 第二步：获取 Geth Dev 账户私钥

Geth dev 模式下会自动创建一个预充值 ETH 的账户。获取方式：

```bash
# 在 Geth console (geth attach http://127.0.0.1:8545) 中执行：
eth.accounts[0]
# 或者通过 web3.js / ethers.js 脚本查看

# dev 模式下的默认账户私钥通常在 keystore 中，也可以直接使用 Hardhat 默认的测试私钥
# 如果用 --dev 模式，可通过 personal.listWallets 查看
```

将私钥填入 `backend/.env` 的 `DEPLOYER_PRIVATE_KEY` 和 `SERVICE_WALLET_PRIVATE_KEY`（本地可用同一个）。

## 第三步：部署智能合约

```bash
cd d:\毕设5
npx hardhat compile
npx hardhat run scripts/deploy.js --network geth_local
```

部署成功后会输出 4 个合约地址，将它们填入：
1. `backend/.env` 中对应的 `FITTOKEN_CONTRACT_ADDRESS` 等字段
2. `frontend/src/utils/contractAddresses.ts` 中的 `CONTRACT_ADDRESSES` 对象

## 第四步：创建数据库并迁移

```bash
# 先在 MySQL 中创建数据库
mysql -u root -e "CREATE DATABASE IF NOT EXISTS gym_blockchain CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -e "CREATE USER IF NOT EXISTS 'gym_user'@'localhost' IDENTIFIED BY '123456'; GRANT ALL ON gym_blockchain.* TO 'gym_user'@'localhost'; FLUSH PRIVILEGES;"

# 运行迁移和种子数据
cd d:\毕设5\backend
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

## 第五步：启动后端

```bash
cd d:\毕设5\backend
npm run dev
```

确认输出：
```
[DB] MySQL connection established successfully
[blockchain] Provider connected to http://127.0.0.1:8545
[blockchain] Service wallet loaded: 0x...
[blockchain] FitToken contract loaded at 0x...
[Server] Backend running at http://localhost:3001
```

## 第六步：启动前端

```bash
cd d:\毕设5\frontend
npm run dev
```

浏览器打开 http://localhost:5173

## 第七步：MetaMask 配置

1. 添加自定义网络：
   - 网络名称：Geth Dev
   - RPC URL：http://127.0.0.1:8545
   - 链 ID：1337
   - 货币符号：ETH

2. 导入 Geth Dev 账户：
   - 使用 deployer 私钥导入账户到 MetaMask

## 核心业务验证流程

1. **首页** → 访问 http://localhost:5173 确认种子数据正常展示
2. **登录** → 点击"连接钱包" → MetaMask 签名 → 新用户跳转注册
3. **注册** → 填写昵称 → 可选链上注册 → 完成后进入会员中心
4. **购买会员卡** → 会员中心 → 购买月卡(0.01 ETH) → MetaMask 确认
5. **每日打卡** → 打卡页面 → 点击"打卡" → MetaMask 确认 → 获得 FitToken
6. **课程预约** → 课程列表 → 选择免费课程 → 预约成功
7. **付费课程** → 选择 FitToken 课程 → 授权 + 支付 → 预约成功
8. **管理员** → 将你的钱包地址的用户角色改为 admin（MySQL 手动改或用种子管理员账号）
9. **管理后台** → /admin/dashboard → 确认统计数据
10. **签到确认** → 管理后台预约列表 → 确认签到 → 用户获得 FitToken 奖励
11. **成就领取** → 打卡后满足条件 → 成就页面领取 NFT
