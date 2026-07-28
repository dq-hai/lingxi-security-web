import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: {
      title: '登录',
      transitionGroup: 'auth'
    }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: {
      title: '数据驾驶舱',
      subtitle: '总览平台态势、预警流和跨区域联动状态',
      order: 0,
      accent: 'brand'
    }
  },
  {
    path: '/monitor',
    name: 'RiskMonitor',
    component: () => import('../views/RiskMonitor.vue'),
    meta: {
      title: '风险监测中心',
      subtitle: '追踪任务级风险评分、判定链路和原始证据',
      order: 1,
      accent: 'danger'
    }
  },
  {
    path: '/strategy',
    name: 'Strategy',
    component: () => import('../views/Strategy.vue'),
    meta: {
      title: '策略实验室',
      subtitle: '联动 URL、RAG 和知识库能力进行主动校验',
      order: 2,
      accent: 'warning'
    }
  },
  {
    path: '/user',
    name: 'UserCenter',
    component: () => import('../views/UserCenter.vue'),
    meta: {
      title: '用户中心',
      subtitle: '管理业务 Token、守护对象和受保护接口调试',
      order: 3,
      accent: 'success'
    }
  },
  {
    path: '/admin-profile',
    name: 'AdminProfile',
    component: () => import('../views/AdminProfile.vue'),
    meta: {
      title: '个人中心',
      subtitle: '查看管理员会话、权限边界和本地安全操作',
      order: 4,
      accent: 'slate'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('admin_token');
  if (to.path !== '/login' && !token) {
    next('/login');
    return;
  }
  next();
});

export default router;
