import React from "react";
import styled from "styled-components";

const ItemContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border: 0;
  border-radius: 2px;
  padding: 8px 12px;
  height: 100px;
  box-shadow: 0 3px 6px 0 rgb(0 0 0 / 16%);
`;

const ValueContainer = styled.div`
  display: flex;
  justify-content: space-between;
`;

const SummaryItem = ({ title, value, subValue, icon }) => (
  <ItemContainer>
    <div>{title}</div>
    <ValueContainer>
      <div>{value}</div>
      <div>{subValue}</div>
    </ValueContainer>
  </ItemContainer>
);

export default SummaryItem;
