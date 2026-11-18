// The gear's popup, opened with props { role: "settings" }: Manygit's scan depth, whether rows
// show their newest tag, and issue linking. Each applies at once.
import { div, svg } from "gpui-kit";
import { v_flex, h_flex, InputState, Input } from "gpui-base";
import { props, closeOverlay, theme, shared, setShared } from "herdr";
import { DEPTH, depthOf } from "./repos.js";
import { icon } from "./menu.js";
import { ISSUES, issueRule } from "./drawer.js";

export class Settings {
  init(cx) {
    this.state = InputState.new({ value: String(depthOf(shared("git-graph.depth"))) });
    this.valid = true;
    // A number from 1 to 5 applies as it's typed; anything else only turns the box red.
    this.state.on("change", (_e, cx) => {
      const text = this.state.value().trim(), n = Number(text);
      this.valid = /^\d+$/.test(text) && n >= DEPTH.min && n <= DEPTH.max;
      if (this.valid) setShared("git-graph.depth", n);
      cx.notify();
    });
    this.state.on("submit", () => { if (this.valid) closeOverlay(props().overlay); });
    // Issue linking applies once both fields make a valid rule; emptying both turns it off.
    const rule = shared(ISSUES) ?? {};
    this.regex = InputState.new({ value: rule.regex ?? "", placeholder: "(PROJ-\\d+)" });
    this.url = InputState.new({ value: rule.url ?? "", placeholder: "https://example.atlassian.net/browse/$1" });
    this.issueOk = true;
    const save = (_e, cx) => {
      const next = { regex: this.regex.value().trim(), url: this.url.value().trim() };
      const empty = !next.regex && !next.url;
      this.issueOk = empty || Boolean(issueRule(next));
      if (this.issueOk) setShared(ISSUES, empty ? null : next);
      cx.notify();
    };
    this.regex.on("change", save);
    this.url.on("change", save);
    this.state.set_selected_range({ start: 0, end: this.state.value().length });
    this.state.focus();
    cx.timer.after(300, () => this.state.focus());
  }

  render() {
    const t = theme(), tags = shared("git-graph.tags") === true;
    const field = (label, state) => h_flex().h(30).gap(10).items_center()
      .child(div().w(44).flex_none().text_color(t.muted).child(label))
      .child(Input.new(state).flex_1().min_w(0).h(30).px(8).rounded(7).border_1().border_color(this.issueOk ? t.input : t.ansi1)
        .bg(t.background).text_size(12).text_color(t.foreground));
    return v_flex().id("git-graph-settings").size_full().p(12).gap(8).bg(t.popover).text_size(12.8).text_color(t.foreground)
      .on_key_down((e, cx) => { if (e.key === "escape") { closeOverlay(props().overlay); cx.stop_propagation(); } })
      .child(h_flex().h(30).gap(10).items_center()
        .child(div().flex_1().font_medium().child("Scan depth"))
        .child(Input.new(this.state).w(56).h(30).px(8).rounded(7).border_1().border_color(this.valid ? t.input : t.ansi1)
          .bg(t.background).text_size(12.8).text_color(t.foreground)))
      .child(h_flex().id("gs-tags").h(30).gap(10).items_center().cursor_pointer()
        .on_click((_e, cx) => { setShared("git-graph.tags", !tags); cx.notify(); })
        .child(div().flex_1().font_medium().child("Show tags"))
        .child(div().size(15).mr(4).flex_none().rounded(4).border_1().border_color(tags ? t.accent : t.input).when(tags, (e) => e.bg(t.accent))
          .flex().items_center().justify_center()
          .when(tags, (e) => e.child(svg(icon("check")).size(11).text_color(t.accent_foreground)))))
      .child(div().mt(4).pt(10).border_t(1).border_color(t.border).font_medium().child("Issue linking"))
      .child(field("Regex", this.regex))
      .child(field("URL", this.url))
      .child(div().text_size(11.5).text_color(this.issueOk ? t.dim : t.ansi1)
        .child(this.issueOk ? "$1 in the URL is the regex's first group." : "Needs a valid regex and an http(s) URL."));
  }
}
