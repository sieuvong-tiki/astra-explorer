import React from "react";
import styled from "styled-components";
import { map } from "lodash";
import { Card, List } from "antd";
import { useParams } from "react-router-dom";
import { astraService } from "../../services";
import { toDay, tokenFormatter } from "../../utils/common";
import WrapStdTx from "../../libs/data/wrapstdtx";
import ObjectFieldListItem from "../../components/ObjectFieldListItem";

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  grid-gap: 24px;
  padding: 0 12px;
`;

const normalizeData = ({
  txhash,
  code,
  height,
  timestamp,
  gas_used,
  gas_wanted,
  tx: { fee, memo, timeout_height, messages },
}) => ({
  basic: {
    txhash,
    status: code === 0 ? "Success" : "Failed",
    height,
    timestamp: toDay(timestamp),
    gas: `${gas_used} / ${gas_wanted}`,
    fee: tokenFormatter(fee),
    memo,
    timeout_height,
  },
  messages,
});

const TransactionDetail = () => {
  const { hash } = useParams();
  const [txDetail, setTxDetail] = React.useState(null);
  React.useEffect(() => {
    astraService.fetchTxDetail(hash).then(WrapStdTx.create).then(setTxDetail);
  }, [hash]);
  if (!txDetail) {
    return null;
  }
  const { basic, messages } = normalizeData(txDetail);

  return (
    <PageContainer>
      <h1>Transaction</h1>
      <Card title="Basic">
        <List
          dataSource={Object.entries(basic)}
          bordered
          renderItem={([fieldName, fieldValue]) => (
            <ObjectFieldListItem
              name={fieldName}
              value={typeof fieldValue === "string" ? fieldValue : JSON.stringify(fieldValue)}
            />
          )}
        />
      </Card>
      <Card title="Messages">
        {map(messages, (msg, index) => (
          <List
            key={index}
            dataSource={Object.entries(msg)}
            bordered
            renderItem={([fieldName, fieldValue]) => (
              <ObjectFieldListItem
                name={fieldName}
                value={typeof fieldValue === "string" ? fieldValue : JSON.stringify(fieldValue)}
              />
            )}
          />
        ))}
      </Card>
    </PageContainer>
  );
};

export default TransactionDetail;
