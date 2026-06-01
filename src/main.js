import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

// Global error handlers — catch errors outside the render loop
window.onerror = (message, source, lineno, colno, error) => {
  console.error('[Global Error Handler]', message, { source, lineno, colno, error });
  // Don't prevent default — let the error propagate to console
  return false;
};

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Unhandled Promise Rejection]', event.reason);
  // Don't prevent default — let the rejection propagate
});

createApp(App).mount('#app')
