import React from "react";
import { Col, List } from "antd";

const ObjectFieldListItem = ({ name, value }) => {
  return (
    <List.Item>
      <Col span={6}>{name}</Col>
      <Col span={18}>{value}</Col>
    </List.Item>
  );
};

export default ObjectFieldListItem;
