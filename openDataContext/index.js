// 开放数据域上下文
const sharedCanvas = wx.getSharedCanvas()
const context = sharedCanvas.getContext('2d')

// 排行榜数据
let rankList = []

// 监听主域发送的消息
wx.onMessage(data => {
  if (!data) return

  switch (data.type) {
    case 'updateScore':
      // 更新分数
      updateScore(data.score)
      break
    case 'showRankList':
      // 显示排行榜
      drawRankList()
      break
  }
})

// 更新分数
async function updateScore(score) {
  try {
    // 获取当前用户信息
    const userInfo = await wx.getUserInfo()
    
    // 上传分数
    await wx.setUserCloudStorage({
      KVDataList: [
        { key: 'score', value: String(score) }
      ]
    })

    // 更新排行榜
    await getFriendRankList()
  } catch (error) {
    console.error('Update score failed:', error)
  }
}

// 获取好友排行榜
async function getFriendRankList() {
  try {
    // 获取群排行榜
    const { data } = await wx.getFriendCloudStorage({
      keyList: ['score']
    })

    // 排序
    rankList = data
      .filter(item => item.KVDataList && item.KVDataList.length > 0)
      .map(item => ({
        nickname: item.nickname,
        avatarUrl: item.avatarUrl,
        score: parseInt(item.KVDataList[0].value) || 0
      }))
      .sort((a, b) => b.score - a.score)

    // 绘制排行榜
    drawRankList()
  } catch (error) {
    console.error('Get rank list failed:', error)
  }
}

// 绘制排行榜
function drawRankList() {
  // 清空画布
  context.clearRect(0, 0, sharedCanvas.width, sharedCanvas.height)

  // 绘制标题
  context.fillStyle = '#ffffff'
  context.font = 'bold 20px Arial'
  context.textAlign = 'center'
  context.fillText('好友排行榜', sharedCanvas.width / 2, 40)

  // 绘制排行榜
  const startY = 80
  const itemHeight = 60
  const avatarSize = 40

  rankList.forEach((item, index) => {
    const y = startY + index * itemHeight

    // 绘制背景
    context.fillStyle = index % 2 === 0 ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.4)'
    context.fillRect(0, y, sharedCanvas.width, itemHeight)

    // 绘制排名
    context.fillStyle = '#ffffff'
    context.font = 'bold 16px Arial'
    context.textAlign = 'left'
    context.fillText(`${index + 1}.`, 20, y + 35)

    // 绘制头像
    const avatar = wx.createImage()
    avatar.src = item.avatarUrl
    avatar.onload = () => {
      context.drawImage(avatar, 60, y + 10, avatarSize, avatarSize)
    }

    // 绘制昵称
    context.fillStyle = '#ffffff'
    context.font = '16px Arial'
    context.textAlign = 'left'
    context.fillText(item.nickname, 110, y + 35)

    // 绘制分数
    context.fillStyle = '#ffeb3b'
    context.font = 'bold 16px Arial'
    context.textAlign = 'right'
    context.fillText(item.score, sharedCanvas.width - 20, y + 35)
  })
}
