import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/components/HomeView.vue'
import ConfiguratorView from '@/components/ConfiguratorView.vue'
import TimerView from '@/components/TimerView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'start', component: HomeView },
    { path: '/configurator', name: 'Configurator', component: ConfiguratorView },
    { path: '/timer', name: 'Timer', component: TimerView }
  ],
})

export default router
