// Copyright (C) 2024 Guyutongxue
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import { GiTcgDataError } from "../../error";
import { CardState } from "../../base/state";
import { getEntityArea, getEntityById } from "../../utils";
import { ContextMetaBase, SkillContext } from "./skill";
import { EntityArea } from "../../base/entity";

export class Card<Meta extends ContextMetaBase> {
  public readonly area: EntityArea;
  constructor(
    private readonly skillContext: SkillContext<Meta>,
    public readonly id: number,
  ) {
    this.area = getEntityArea(this.skillContext.state, this.id);
  }
  
  get state(): CardState {
    return getEntityById(this.skillContext.state, this.id) as CardState;
  }

  getVariable(name: string): never {
    throw new GiTcgDataError("Cannot get variable of a card");
  }
  dispose(): never {
    throw new GiTcgDataError("Cannot dispose a card in this method");
    this.skillContext.disposeCard(this.state);
  }
}

export type TypedCard<Meta extends ContextMetaBase> = Card<Meta>;
