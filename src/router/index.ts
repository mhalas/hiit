import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import ConfiguratorView from '@/views/ConfiguratorView.vue';
import TimerView from '@/views/TimerView.vue';

export const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/configurator', name: 'configurator', component: ConfiguratorView },
  { path: '/timer', name: 'timer', component: TimerView },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
