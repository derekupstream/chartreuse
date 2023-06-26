import * as S from './styles';

const Container: React.FC<{ children: any }> = ({ children, ...props }) => {
  return <S.Container {...props}>{children}</S.Container>;
};

export default Container;
