import { shallowMount } from "@vue/test-utils";
import LiveStandings from "@/views/LiveStandings.vue";

describe("LiveStandings.vue", () => {
  let wrapper;

  beforeEach(() => {
    wrapper = shallowMount(LiveStandings, {
      data() {
        return {
          isLoading: false,
          errorMessage: "",
          trackName: "Test Track",
        };
      },
    });
  });

  it("renders without crashing", () => {
    expect(wrapper.exists()).toBe(true);
  });

  it("displays the correct track name", () => {
    expect(wrapper.find(".trackName p").text()).toBe("Track: Test Track");
  });

  it("displays loading spinner when isLoading is true", async () => {
    await wrapper.setData({ isLoading: true });
    expect(
      wrapper.find(".container-fluid .text-center b-spinner").exists()
    ).toBe(true);
  });

  it("displays error message when errorMessage is set", async () => {
    await wrapper.setData({ errorMessage: "Test Error" });
    expect(wrapper.find(".error-message .text-center").text()).toBe(
      "Test Error"
    );
  });

  // Test the methods
  it("converts seconds to H:M:S format correctly", () => {
    expect(wrapper.vm.secondsToHms(3661)).toBe("1:01:01");
  });

  it("converts seconds to time format correctly", () => {
    expect(wrapper.vm.sec2time(3661)).toBe("61:01.000");
  });
});
