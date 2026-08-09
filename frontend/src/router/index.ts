import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import { authenticatedHttpClient } from "../services/http/AuthenticatedHttpClient.js";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "home",
    component: () => import("../views/HomeView.vue"),
  },
  {
    path: "/login",
    name: "login",
    component: () => import("../views/LoginView.vue"),
  },
  {
    path: "/categories",
    name: "categories",
    component: () => import("../views/CategoriesView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/categories/new",
    name: "category-form",
    component: () => import("../views/CategoryFormView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/categories/:id/edit",
    name: "category-edit",
    component: () => import("../views/CategoryFormView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/categories/:id/articles",
    name: "category-articles",
    component: () => import("../views/CategoryArticlesView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/articles/new",
    name: "article-form",
    component: () => import("../views/ArticleFormView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/articles/:id/edit",
    name: "article-edit",
    component: () => import("../views/ArticleFormView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/articles/:id",
    name: "article-detail",
    component: () => import("../views/ArticleDetailView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/search",
    name: "search",
    component: () => import("../views/SearchView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/users",
    name: "user-management",
    component: () => import("../views/UserManagementView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/:pathMatch(.*)*",
    name: "not-found",
    component: () => import("../views/NotFoundView.vue"),
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !authenticatedHttpClient.isAuthenticated()) {
    return { path: "/login", query: { redirect: to.fullPath } };
  }
  return true;
});
