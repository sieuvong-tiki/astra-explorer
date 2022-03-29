import React from "react";
import Moment from "moment";
import styled from "styled-components";
import { useHistory } from "react-router-dom";
import take from "lodash/take";
import { Button, Card, message, Spin, Table, Typography } from "antd";
import { astraService } from "../../services";
import SummaryItem from "./components/SummaryItem";
import { formatNumber, formatTokenAmount, getStakingValidatorByHex, percent } from "../../utils/common";
import { usePrevious } from "../../utils/hooks";

const REFRESH_INTERVAL = 5000;
const VISIBLE_BLOCKS = 10;
let fetcherInterval = null;

const PLACEHOLDER_CHAR = "-";

const SearchSection = styled.div`
  display: flex;
  justify-content: center;
  flex-direction: column;
  width: 100%;
  text-align: center;
`;

const SummarySection = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  grid-gap: 12px;
`;

const useDashboardData = () => {
  const [isDataLoaded, setDataLoaded] = React.useState(false);
  const [blocks, setBlocks] = React.useState([]);
  const [validators, setValidators] = React.useState([]);
  const [intervalData, setIntervalData] = React.useState({});
  const previousBlockHeight = usePrevious(intervalData?.blockHeight);

  const fetchDashboardData = React.useCallback(async () => {
    try {
      const [latestBlock, stakingPool, stakingParams, inflation] = await Promise.all([
        astraService.fetchLatestBlock(),
        astraService.fetchStakingPool(),
        astraService.fetchStakingParams(),
        astraService.fetchInflation(),
      ]);
      const bankTotal = await astraService.fetchBankTotal(stakingParams.result.bond_denom);
      const blockHeight = latestBlock?.block?.header?.height || 0;

      setDataLoaded(true);
      setIntervalData({ latestBlock, blockHeight, stakingPool, stakingParams, inflation, bankTotal });
    } catch (error) {
      console.error(error);
      message.error(error);
    }
  }, []);

  const fetchLatestBlocks = React.useCallback(async ({ blockHeight, needQueryBlocksNum }) => {
    const needQueryBlockHeights = Array.from({ length: needQueryBlocksNum }).map((_, index) => blockHeight - index - 1);
    const needQueryBlockPromises = needQueryBlockHeights.map((height) => astraService.fetchBlockByHeight(height));
    const latestBlock = await Promise.all(needQueryBlockPromises);
    return latestBlock;
  }, []);

  const fetchValidators = React.useCallback(async () => {
    const { result: validators = [] } = await astraService.fetchValidators();
    localStorage.setItem("validators", JSON.stringify(validators));
    setValidators(validators);
  }, []);

  React.useEffect(() => {
    if (previousBlockHeight !== intervalData.blockHeight) {
      let newBlocks = [intervalData.latestBlock, ...blocks];
      if (newBlocks.length < VISIBLE_BLOCKS) {
        const needQueryBlocksNum = VISIBLE_BLOCKS - newBlocks.length;
        fetchLatestBlocks({ blockHeight: intervalData.blockHeight, needQueryBlocksNum }).then((latestBlock) =>
          setBlocks(take([...newBlocks, ...latestBlock], VISIBLE_BLOCKS))
        );
      } else {
        setBlocks(take(newBlocks, VISIBLE_BLOCKS));
      }
    }
  }, [intervalData.blockHeight, previousBlockHeight, blocks, intervalData.latestBlock]);

  React.useEffect(() => {
    if (fetcherInterval) {
      clearInterval(fetcherInterval);
    }
    fetchValidators();
    fetchDashboardData();
    fetcherInterval = setInterval(fetchDashboardData, REFRESH_INTERVAL);

    return () => {
      clearInterval(fetcherInterval);
    };
  }, []);

  return { ...intervalData, validators, blocks, isDataLoaded };
};

const useSummaryDisplay = (data = {}) => {
  const { latestBlock, stakingPool = {}, stakingParams = {}, inflation, bankTotal = {} } = data || {};
  const { result: { bonded_tokens } = {} } = stakingPool;
  const { result: { bond_denom } = {} } = stakingParams;
  const { result: { amount } = {} } = bankTotal;

  const latestBlockCreatedTime = Moment(latestBlock?.block?.header?.time).fromNow();
  const boundedTokenNum = formatNumber(formatTokenAmount(bonded_tokens, 2, bond_denom), true, PLACEHOLDER_CHAR) || 0;
  const unboundedTokenNum = formatNumber(formatTokenAmount(amount, 2, bond_denom), true, PLACEHOLDER_CHAR) || 0;
  const boundedTokenPercent = `${percent(bonded_tokens / amount) || PLACEHOLDER_CHAR}%`;
  const boundedTokenDetail = `${boundedTokenNum} / ${unboundedTokenNum}`;
  const inflationPercent = `${percent(inflation?.inflation) || PLACEHOLDER_CHAR}%`;

  return {
    boundedTokenPercent,
    boundedTokenDetail,
    inflationPercent,
    latestBlockCreatedTime,
  };
};

const useBlocksTableProps = (data) => {
  const { blocks = [] } = data;
  const history = useHistory();
  const columns = [
    {
      title: "Height",
      dataIndex: "height",
      render: (text) => (
        <Typography.Link
          onClick={() => {
            history.push(`/block/${text}`);
          }}
        >
          {text}
        </Typography.Link>
      ),
    },
    {
      title: "Proposer",
      dataIndex: "proposer",
    },
    {
      title: "Txs",
      dataIndex: "txs",
    },
    {
      title: "Time",
      dataIndex: "time",
    },
  ];
  const tableData = blocks.map(({ block }) => ({
    height: block?.header?.height,
    proposer: getStakingValidatorByHex(block?.header?.proposer_address),
    txs: block.data.txs.length,
    time: Moment(block?.header?.time).format("DD-MM-YYYY hh:mm:ss"),
  }));

  return { rowKey: "height", columns, dataSource: tableData, pagination: false };
};
const Dashboard = () => {
  const data = useDashboardData();
  const { boundedTokenPercent, boundedTokenDetail, inflationPercent, latestBlockCreatedTime } = useSummaryDisplay(data);
  const blocksTableProps = useBlocksTableProps(data);

  if (!data.isDataLoaded) {
    return <Spin />;
  }

  return (
    <>
      <SearchSection></SearchSection>
      <SummarySection>
        <SummaryItem title="Block" value={data.blockHeight} subValue={latestBlockCreatedTime} />
        {/* <SummaryItem title="Transactions" value={0} subValue="Total" /> */}
        <SummaryItem title="Bonded Tokens" value={boundedTokenPercent} subValue={boundedTokenDetail} />
        <SummaryItem title="Inflation" value={inflationPercent} subValue="Year" />
      </SummarySection>
      <Card title="Blocks" actions={<Button type="link">Show more</Button>}>
        <Table {...blocksTableProps} />
      </Card>
    </>
  );
};

export default Dashboard;
