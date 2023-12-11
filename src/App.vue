<script setup></script>

<template>
  <div id="app">
    <div>
      <b-navbar type="dark">
        <b-navbar-brand> </b-navbar-brand>
        <b-navbar-nav>
          <b-nav-item>
            <RouterLink to="/">Home</RouterLink>
          </b-nav-item>
          <b-nav-item>
            <RouterLink to="/LiveStandings">Live Timing</RouterLink></b-nav-item
          >
          <b-nav-item>
            <RouterLink to="/TracksArchive"
              >Track Records</RouterLink
            ></b-nav-item
          >
        </b-navbar-nav>
      </b-navbar>
    </div>
    <router-view />
  </div>
</template>
