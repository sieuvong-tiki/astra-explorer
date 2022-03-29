import React from "react";
import moment from "moment";
import styled from "styled-components";
import { get } from "lodash";
import { Card, List, Table } from "antd";
import { useParams } from "react-router-dom";
import { astraService } from "../../services";
import {
  abbrAddress,
  abbrMessage,
  formatToken,
  getStakingValidatorOperator,
  percent,
  toDay,
  tokenFormatter,
} from "../../utils/common";
import Text from "antd/lib/typography/Text";
import { Link } from "react-router-dom";
import ObjectFieldListItem from "../../components/ObjectFieldListItem";

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  grid-gap: 24px;
  padding: 0 12px;
`;

const calcAmount = (assets = [], path = "amount") => assets.reduce((prev, value) => prev + Number(get(value, path)), 0);
const calcPercent = (amount = 0, total = 1) => percent(Number(amount) / total);

const normalizeData = ({
  accountDetail: { result: accountDetail },
  accountBalance: { result: balances = [] } = {},
  stakingDelegations = {},
  stakingRewards: { total: totalRewards = [], rewards = [] },
  stakingUnbounding = { amount: 0 },
  txs: { txs = [] } = {},
}) => {
  const balanceAmount = calcAmount(balances);
  const rewardsAmount = calcAmount(totalRewards);
  const deletegationAmounts = calcAmount(stakingDelegations, "balance.amount");
  const totalAmount = balanceAmount + rewardsAmount + deletegationAmounts + (stakingUnbounding.amount || 0);

  const balanceAssets = balances.map((balance) => ({
    type: "Balance",
    amount: balanceAmount,
    percent: calcPercent(balanceAmount, totalAmount),
    ...balance,
  }));
  const delegationAsset = {
    type: "Delegation",
    amount: deletegationAmounts,
    percent: calcPercent(deletegationAmounts, totalAmount),
    denom: stakingDelegations[0].balance.denom,
  };
  const unboundingAsset = {
    type: "Unbounding",
    amount: 0,
    percent: calcPercent(stakingUnbounding.amount, totalAmount),
    ...stakingUnbounding,
  };
  const rewardsAssets = totalRewards.map((reward) => ({
    type: "Reward",
    amount: rewardsAmount,
    percent: calcPercent(rewardsAmount, totalAmount),
    ...reward,
  }));

  const delegationInfos = stakingDelegations.map((e) => {
    const reward = rewards.find((r) => r.validator_address === e.delegation.validator_address);
    return {
      validator: getStakingValidatorOperator(e.delegation.validator_address, 8),
      token: formatToken(e.balance, {}, 2),
      reward: tokenFormatter(reward.reward, reward.reward[0]?.denoms),
      action: e.delegation.validator_address,
    };
  });

  const transactionInfos = txs.map((x) => ({
    height: Number(x.height),
    txhash: x.txhash,
    msgs: abbrMessage(x.tx.msg ? x.tx.msg : x.tx.value.msg),
    time: toDay(x.timestamp),
  }));

  const accountInfo = {
    ["Account Type"]: accountDetail.type,
    ["Account Number"]: accountDetail.value?.account_number,
    ["Sequence"]: accountDetail.value?.sequence,
    ["Public Key"]: JSON.stringify(accountDetail.value?.public_key),
  };
  console.log("super", {
    balanceAmount,
    rewardsAmount,
    totalAmount,
    deletegationAmounts,
    balanceAssets,
    delegationAsset,
    unboundingAsset,
    balanceAssets,
    delegationInfos,
    accountInfo,
    accountDetail,
  });
  return {
    assets: [...balanceAssets, delegationAsset, ...rewardsAssets, unboundingAsset],
    delegationInfos,
    transactionInfos,
    accountInfo,
  };
};

const useDelegationTable = () => {
  const columns = [
    {
      dataIndex: "validator",
      key: "validator",
      title: "Validator",
    },
    {
      dataIndex: "token",
      key: "token",
      title: "Token",
    },
    {
      dataIndex: "reward",
      key: "reward",
      title: "Reward",
    },
    {
      dataIndex: "action",
      key: "action",
      title: "Action",
      render: () => null,
    },
  ];
  return {
    rowKey: "validator",
    columns,
    pagination: false,
  };
};

const useTxsTable = () => {
  const columns = [
    {
      dataIndex: "height",
      key: "height",
      title: "Height",
      render: (text) => <Link to={`/block/${text}`}>{text}</Link>,
    },
    {
      dataIndex: "txhash",
      key: "txhash",
      title: "TX Hash",
      render: (text) => <Link to={`/transaction/${text}`}>{abbrAddress(text)}</Link>,
    },
    {
      dataIndex: "msgs",
      key: "msgs",
      title: "Msgs",
    },
    {
      dataIndex: "time",
      key: "time",
      title: "Time",
      render: (text) => moment(text).format("DD/MM/YYYY hh:mm:ss"),
    },
  ];
  return {
    rowKey: "txhash",
    columns,
    pagination: false,
  };
};

const TransactionDetail = () => {
  const { address } = useParams();
  const [accountDetail, setAccountDetail] = React.useState(null);
  const [accountBalance, setAccountBalance] = React.useState(null);
  const [stakingRewards, setStakingRewards] = React.useState(null);
  const [stakingValidators, setStakingValidators] = React.useState(null);
  const [stakingDelegations, setStakingDelegations] = React.useState(null);
  const [stakingUnbounding, setStakingUnbounding] = React.useState(null);
  const [txs, setTxs] = React.useState(null);
  const [dataLoaded, setDataLoaded] = React.useState(false);

  const delegationTableProps = useDelegationTable();
  const txsTableProps = useTxsTable();

  React.useEffect(() => {
    Promise.all([
      astraService.fetchAccountInfo(address).then(setAccountDetail),
      astraService.fetchAccountBalance(address).then(setAccountBalance),
      astraService.fetchStakingRewards(address).then(setStakingRewards),
      astraService.fetchStakingValidators(address).then(setStakingValidators),
      astraService.fetchStakingDelegations(address).then(setStakingDelegations),
      astraService.fetchStakingUnbounding(address).then(setStakingUnbounding),
      astraService.getTxsBySender({ sender: address }).then(setTxs),
    ]).then(() => setDataLoaded(true));
  }, [address]);

  if (!dataLoaded) {
    return null;
  }
  const normalizedData = normalizeData({
    accountDetail,
    accountBalance,
    stakingRewards,
    stakingValidators,
    stakingDelegations,
    stakingUnbounding,
    txs,
  });
  const { assets, delegationInfos, transactionInfos, accountInfo } = normalizedData;
  console.log({
    assets,
    address,
    accountDetail,
    accountBalance,
    stakingRewards,
    stakingValidators,
    stakingDelegations,
    stakingUnbounding,
    txs,
  });

  return (
    <PageContainer>
      <h1>Address: {address}</h1>
      <Card title="Assets">
        <List
          dataSource={assets}
          bordered
          renderItem={(token) => {
            const { type, percent, denom } = token;
            return (
              <ObjectFieldListItem
                name={<Text strong>{type}</Text>}
                value={
                  <div>
                    {formatToken(token, denom)}
                    &nbsp;
                    <Text>({percent}%)</Text>
                  </div>
                }
              />
            );
          }}
        />
      </Card>
      <Card title="Delegation">
        <Table {...delegationTableProps} dataSource={delegationInfos} />
      </Card>
      <Card title="Transactions">
        <Table {...txsTableProps} dataSource={transactionInfos} />
      </Card>
      <Card title="Profile">
        <List
          dataSource={Object.entries(accountInfo)}
          bordered
          renderItem={([fieldName, fieldValue]) => <ObjectFieldListItem name={fieldName} value={fieldValue} />}
        />
      </Card>
    </PageContainer>
  );
};

export default TransactionDetail;
