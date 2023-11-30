import Vue from "vue";
import VueRouter from "vue-router";
import HomeView from "../views/HomeView.vue";

Vue.use(VueRouter);

const router = new VueRouter({
  mode: "history",
  base: import.meta.env.BASE_URL,
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/about",
      name: "about",
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import("../views/AboutView.vue"),
    },
    {
      path: "/rF2",
      name: "rF2",
      component: () => import("../views/rF2Test.vue"),
    },
    {
      path: "/LiveStandings",
      name: "LiveStandings",
      component: () => import("../views/LiveStandings.vue"),
    },
    {
      path: "/TracksArchive",
      name: "TracksArchive",
      component: () => import("../views/TracksArchive.vue"),
    },
    {
      path: "/TrackRecordsArchive/:trackVenue",
      name: "TrackRecordsArchive",
      component: () => import("../views/TrackRecordsArchive.vue"),
    },
  ],
});

export default router;
