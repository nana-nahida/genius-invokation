import { For, Show, createEffect, createSignal } from "solid-js";
import {
  T as tagMap,
  Y as typeMap,
  a as actionCards,
  c as characters,
} from "./data.json" /*  with { type: "json" } */;
import { useDeckBuilderContext } from "./DeckBuilder";
import { Card } from "./Card";
import type { AllCardsProps } from "./AllCards";

const AC_TYPE_TEXT = {
  [typeMap.indexOf("GCG_CARD_MODIFY")]: {
    name: "装备牌",
    tags: {
      [tagMap.indexOf("GCG_TAG_WEAPON")]: "武器",
      [tagMap.indexOf("GCG_TAG_WEAPON_BOW")]: "弓",
      [tagMap.indexOf("GCG_TAG_WEAPON_SWORD")]: "单手剑",
      [tagMap.indexOf("GCG_TAG_WEAPON_CLAYMORE")]: "双手剑",
      [tagMap.indexOf("GCG_TAG_WEAPON_POLE")]: "长柄武器",
      [tagMap.indexOf("GCG_TAG_WEAPON_CATALYST")]: "法器",
      [tagMap.indexOf("GCG_TAG_ARTIFACT")]: "圣遗物",
      [tagMap.indexOf("GCG_TAG_TALENT")]: "天赋",
    },
  },
  [typeMap.indexOf("GCG_CARD_EVENT")]: {
    name: "事件牌",
    tags: {
      [tagMap.indexOf("GCG_TAG_LEGEND")]: "秘传",
      [tagMap.indexOf("GCG_TAG_FOOD")]: "食物",
      [tagMap.indexOf("GCG_TAG_RESONANCE")]: "元素共鸣",
      [tagMap.indexOf("GCG_TAG_TALENT")]: "天赋",
    },
  },
  [typeMap.indexOf("GCG_CARD_ASSIST")]: {
    name: "支援牌",
    tags: {
      [tagMap.indexOf("GCG_TAG_PLACE")]: "场地",
      [tagMap.indexOf("GCG_TAG_ALLY")]: "伙伴",
      [tagMap.indexOf("GCG_TAG_ITEM")]: "道具",
    },
  },
};

export const ACTION_CARDS = Object.fromEntries(
  actionCards.map((ac) => [ac.i, ac] as const),
);

const LEGEND_TAG_IDX = tagMap.indexOf("GCG_TAG_LEGEND");

const IS_LEGEND = Object.fromEntries(
  actionCards.map((ac) => [ac.i, ac.t.includes(LEGEND_TAG_IDX)] as const),
);
const CHARACTER_TAGS = Object.fromEntries(
  characters.map((ch) => [ch.i, ch.t] as const),
);

export function AllActionCards(props: AllCardsProps) {
  const [acType, setAcType] = createSignal<number>(0);
  const [acTag, setAcTag] = createSignal<string>("");

  const availableTags = () => AC_TYPE_TEXT[acType()].tags;

  const count = (id: number) => {
    return props.deck.cards.filter((c) => c === id).length;
  };
  const fullCards = () => {
    return props.deck.cards.length >= 30;
  };

  // Remove invalid action cards
  createEffect(() => {
    const currentCharacters = props.deck.characters;
    const currentChTags = currentCharacters.flatMap(
      (c) => CHARACTER_TAGS[Number(c)],
    );
    const currentCards = props.deck.cards;
    const result: number[] = [];
    for (const id of currentCards) {
      const ac = ACTION_CARDS[id];
      if (!ac) {
        continue;
      }
      if (typeof ac.rc !== "undefined" && !currentCharacters.includes(ac.rc)) {
        continue;
      }
      if (
        typeof ac.rt !== "undefined" &&
        currentChTags.filter((t) => t === ac.rt).length < 2
      ) {
        continue;
      }
      result.push(id);
    }
    if (result.length < currentCards.length) {
      props.onChangeDeck?.({
        ...props.deck,
        cards: result,
      });
    }
  });
  const maxCount = (id: number) => {
    return IS_LEGEND[id] ? 1 : 2;
  };

  const toggleCard = (id: number) => {
    const cnt = count(id);
    if (cnt >= maxCount(id)) {
      props.onChangeDeck?.({
        ...props.deck,
        cards: props.deck.cards.filter((c) => c !== id),
      });
    } else if (!fullCards()) {
      props.onChangeDeck?.({
        ...props.deck,
        cards: [...props.deck.cards, id],
      });
    } else if (cnt) {
      props.onChangeDeck?.({
        ...props.deck,
        cards: props.deck.cards.filter((c) => c !== id),
      });
    }
  };

  const filtered = () => {
    const ty = acType();
    const tag = acTag();
    const currentCharacters = props.deck.characters;
    const currentChTags = currentCharacters.flatMap(
      (c) => CHARACTER_TAGS[Number(c)],
    );
    const filtered = actionCards.filter(
      (ac) =>
        (ty === null || ac.y === ty) &&
        (tag === "" || ac.t.includes(Number(tag))),
    );
    const withReq = filtered.filter((ac) => {
      if (typeof ac.rc !== "undefined") {
        return currentCharacters.includes(ac.rc);
      }
      if (typeof ac.rt !== "undefined") {
        return currentChTags.filter((t) => t === ac.rt).length >= 2;
      }
      return false;
    });
    const withoutReq = filtered.filter(
      (ac) => typeof ac.rc === "undefined" && typeof ac.rt === "undefined",
    );
    return [...withReq, ...withoutReq];
  };
  return (
    <div class="h-full flex flex-col">
      <div class="flex flex-row gap-2 mb-2">
        <For each={Object.keys(AC_TYPE_TEXT)}>
          {(ty, i) => (
            <button
              onClick={() => (setAcType(i()), setAcTag(""))}
              data-selected={acType() === i()}
              class="flex-shrink-0 data-[selected=true]:font-bold"
            >
              {AC_TYPE_TEXT[Number(ty)].name}
            </button>
          )}
        </For>
        <select
          class="flex-grow border-black border-1px"
          value={acTag()}
          onChange={(e) => setAcTag(e.target.value)}
        >
          <option value="">不限标签</option>
          <For each={Object.keys(availableTags())}>
            {(tag) => (
              <option value={tag}>{availableTags()[Number(tag)]}</option>
            )}
          </For>
        </select>
      </div>
      <ul class="flex-grow overflow-auto flex flex-row flex-wrap gap-2">
        <For each={filtered()}>
          {(ac) => (
            <li
              class="relative cursor-pointer data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-60 data-[disabled=true]:filter-none hover:brightness-110"
              data-disabled={fullCards() && !count(ac.i)}
              onClick={() => toggleCard(ac.i)}
            >
              <div class="w-[60px]">
                <Card
                  id={ac.i}
                  name={ac.n}
                  selected={count(ac.i) === maxCount(ac.i)}
                  partialSelected={
                    !!count(ac.i) && count(ac.i) !== maxCount(ac.i)
                  }
                />
                <Show when={count(ac.i)}>
                  <Show
                    when={count(ac.i) === maxCount(ac.i)}
                    fallback={
                      <div class="absolute left-1/2 top-1/2 translate-x--1/2 translate-y--1/2 text-2xl z-1 pointer-events-none">
                        &#128993;
                      </div>
                    }
                  >
                    <div class="absolute left-1/2 top-1/2 translate-x--1/2 translate-y--1/2 text-2xl z-1 pointer-events-none">
                      &#9989;
                    </div>
                  </Show>
                </Show>
              </div>
            </li>
          )}
        </For>
      </ul>
    </div>
  );
}
