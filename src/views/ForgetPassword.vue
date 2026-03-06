<template>
  <div class="forget-wrapper">
    <div class="forget-card">
      <div class="forget-header">
        <div class="logo-circle"></div>
        <h2 class="forget-title">忘记密码</h2>
        <p class="forget-subtitle">请输入你账号对应的初始密码或你的身份证号后六位验证身份</p>
      </div>
      <form class="forget-form">
        <div class="form-group">
          <label>初始密码</label>
          <input class="input-field" placeholder="请输入初始密码" />
        </div>
        <div class="form-group">
          <label>新密码（这次请认真记住）</label>
          <input class="input-field" placeholder="请输入新密码" />
        </div>
        <div class="form-group">
          <label>确认新密码</label>
          <input class="input-field" placeholder="请再次输入新密码" />
        </div>
        <button class="submit-btn">修改密码</button>
        <button class="back-btn" type="button" @click="goLogin">返回登录页</button>
        <div class="role-selector">
          <div class="role-item active">学生 / 老师</div>
          <div class="role-item">失物招领管理员</div>
          <div class="role-item">系统管理员</div>
        </div>
      </form>
      <div class="forget-footer">
        首次登录请使用身份证后六位作为初始密码<br />
        如遇问题请联系技术支持
      </div>
    </div>
    <footer class="copyright">
      © 校园失物招领系统. 用心找回每一份珍贵.
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
const goLogin = () => {
  router.push('/')
}
// 仅做静态UI展示，无逻辑
</script>

<style scoped>
.forget-wrapper {
  min-height: 100vh;
  width: 100vw;
  background: #ffac6c;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}
.forget-card {
  width: 420px;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.10);
  padding: 38px 38px 24px;
  margin: 40px 0 0 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}
.forget-header {
  text-align: center;
  margin-bottom: 18px;
}
.logo-circle {
  width: 48px;
  height: 48px;
  background: #f97316;
  border-radius: 50%;
  margin: 0 auto 12px;
}
.forget-title {
  font-size: 24px;
  font-weight: bold;
  color: #222;
  margin-bottom: 6px;
}
.forget-subtitle {
  color: #888;
  font-size: 13px;
  margin-bottom: 0;
}
.forget-form {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.form-group {
  margin-bottom: 16px;
}
.form-group label {
  display: block;
  font-size: 14px;
  color: #333;
  margin-bottom: 6px;
  font-weight: 600;
}
.input-field {
  width: 100%;
  padding: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  background: #f9f9f9;
  font-size: 14px;
  color: #333;
  outline: none;
  transition: all 0.2s;
}
.input-field:focus {
  border-color: #f97316;
  background: #fff;
}
.submit-btn {
  width: 100%;
  padding: 13px;
  background: #f97316;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  margin-bottom: 18px;
  margin-top: 2px;
}
.back-btn {
  width: 100%;
  padding: 10px;
  background: #fff;
  color: #f97316;
  border: 1px solid #f97316;
  border-radius: 6px;
  font-size: 15px;
  font-weight: bold;
  cursor: pointer;
  margin-bottom: 10px;
  margin-top: 2px;
  transition: background 0.2s, color 0.2s;
}
.back-btn:hover {
  background: #f97316;
  color: #fff;
}
.role-selector {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 10px;
}
.role-item {
  font-size: 12px;
  color: #666;
  cursor: pointer;
  padding: 6px 14px;
  border-radius: 20px;
  font-weight: 600;
  white-space: nowrap;
  transition: all 0.2s;
  background: #f5f5f5;
}
.role-item.active {
  background: #f97316;
  color: #fff;
}
.forget-footer {
  text-align: center;
  margin-top: 10px;
  padding-top: 10px;
  color: #aaa;
  font-size: 12px;
  line-height: 1.7;
}
.copyright {
  position: absolute;
  bottom: 12px;
  color: rgba(51, 51, 51, 0.5);
  font-size: 12px;
  text-align: center;
  width: 100%;
}
</style>
