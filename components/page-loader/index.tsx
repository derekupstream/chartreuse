import { Spin } from "antd";
import * as S from "./styles";

export default function PageLoader() {
  return (
    <S.Wrapper>
      <Spin />
    </S.Wrapper>
  );
}
