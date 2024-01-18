<template>
  <div class="sectors">
    <div class="square" :style="{ backgroundColor: color }">
      <p>{{ sector }}</p>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    sector: {
      type: String,
      required: true,
    },
    flag: {
      type: String,
      default: "",
    },
  },
  computed: {
    color() {
      return this.flag.includes("YELLOW") ? "yellow" : "rgb(18, 197, 0)";
    },
  },
};
</script>

<style scoped>
.square {
  height: 50px;
  width: 150px;
  color: rgb(0, 0, 0);
  text-align: center;
  border-radius: 5px 5px 5px 5px;
}

.sectors {
  display: flex;
  height: 55px;
  justify-content: center;
  gap: 0px;
}
.sectors p {
  padding-top: 0.75rem;
  font-weight: bolder;
  font-size: large;
}
</style>
