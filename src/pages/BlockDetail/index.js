import React from "react";
import styled from "styled-components";
import { map } from "lodash";
import { Card, List, Table } from "antd";
import { useParams } from "react-router-dom";
import { astraService } from "../../services";
import { abbrAddress, abbrMessage, decodeTx, tokenFormatter } from "../../utils/common";
import { Link } from "react-router-dom";
import ObjectFieldListItem from "../../components/ObjectFieldListItem";

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  grid-gap: 24px;
  padding: 0 12px;
`;

const normalizeTx = ({ hash, fee, memo, messages }) => ({
  hash,
  fee: tokenFormatter(fee),
  memo,
  messages: abbrMessage(messages),
});

const normalizeData = ({
  block_id,
  block: {
    header,
    data: { txs },
  },
}) => ({
  block_id,
  header,
  txs: map(map(txs, decodeTx), normalizeTx),
});

const useTxsTable = () => {
  const columns = [
    {
      key: "hash",
      dataIndex: "hash",
      title: "Hash",
      render: (text) => <Link to={`/transaction/${text}`}>{abbrAddress(text)}</Link>,
    },
    {
      key: "fee",
      dataIndex: "fee",
      title: "Fee",
    },
    {
      key: "memo",
      dataIndex: "memo",
      title: "Memo",
    },
    {
      key: "messages",
      dataIndex: "messages",
      title: "Messages",
    },
  ];

  return { columns, rowKey: "hash" };
};

const BlockDetail = () => {
  const { height } = useParams();
  const [blockDetail, setBlockDetail] = React.useState(null);
  const txsTableProps = useTxsTable();
  React.useEffect(() => {
    astraService.fetchBlockByHeight(height).then(setBlockDetail);
  }, [height]);
  if (!blockDetail) {
    return null;
  }
  const { block_id, header, txs } = normalizeData(blockDetail);

  return (
    <PageContainer>
      <h1>Block</h1>
      <Card title="Block ID">
        <List
          dataSource={Object.entries(block_id)}
          bordered
          renderItem={([fieldName, fieldValue]) => (
            <ObjectFieldListItem
              name={fieldName}
              value={typeof fieldValue === "string" ? fieldValue : JSON.stringify(fieldValue)}
            />
          )}
        />
      </Card>
      <Card title="Header">
        <List
          dataSource={Object.entries(header)}
          bordered
          renderItem={([fieldName, fieldValue]) => (
            <ObjectFieldListItem
              name={fieldName}
              value={typeof fieldValue === "string" ? fieldValue : JSON.stringify(fieldValue)}
            />
          )}
        />
      </Card>
      <Card title="Transactions">
        <Table dataSource={txs} {...txsTableProps} />
      </Card>
    </PageContainer>
  );
};

export default BlockDetail;
