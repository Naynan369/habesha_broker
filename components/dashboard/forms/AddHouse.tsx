import {
	Button,
	CircularProgress,
	CircularProgressLabel,
	Flex,
	FormControl,
	FormLabel,
	Grid,
	Heading,
	Image,
	Input,
	Modal,
	ModalBody,
	ModalContent,
	ModalOverlay,
	Select,
	SimpleGrid,
	Text,
	Textarea,
	useToast,
	useColorModeValue,
} from "@chakra-ui/react";
import { useLang } from "@libs/hooks/useLang";
import axios from "axios";
import { Formik } from "formik";
import { useRouter } from "next/router";
import { useState } from "react";
import { MdClose, MdSave } from "react-icons/md";
import * as yup from "yup";
import { InputField } from "./InputField";

const HouseAddItemSchema = yup.object().shape({
	title: yup
		.string()
		.min(5, "Too Short, Minimum of 5 characters")
		.max(300, "Too Long, Maximum of 300 characters")
		.required("You must add a title to the item"),
	price: yup.number().required("You must add price"),
	type: yup.string(),
	description: yup.string(),
	files: yup.array().min(1, "Add at least one photo"),
	region: yup
		.string()
		.required("You have to add a region the house is located in"),
	city: yup
		.string()
		.required("You have to add a city the house is located in"),
	room: yup.number().min(1, "at least there should be 1 room"),
	area: yup.number().required("Please Specify The area"),
});

export const HouseAddForm = ({ user }) => {
	const router = useRouter();
	const toast = useToast();
	const text = useLang().businessListing;
	const uploadButtonBg = useColorModeValue("orange.50", "whiteAlpha.100");
	const uploadButtonText = useColorModeValue("orange.800", "orange.100");
	const [uploadProgress, setUploadProgress] = useState(0);

	const initialValues = {
		title: "",
		description: "",
		price: 0.0,
		priceType: "FIXED",
		itemType: "HOUSE",
		files: [],

		area: 0.0,
		room: 1,
		type: "FORSALE",
		region: "",
		city: "",
	};

	const onSubmit = (values, actions) => {
		const formdata = new FormData();
		const { files, ...others } = values;

		for (let key in others) {
			formdata.append(key, others[key]);
		}

		files.forEach((file) => {
			formdata.append("files", file);
		});

		actions.setSubmitting(true);

		axios
			.post("/api/items/add", formdata, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
				onUploadProgress: (event) => {
					setUploadProgress((event.loaded * 100) / event.total);
				},
			})
			.then((res) => {
				const { msg } = res.data;

				toast({
					title: "Success",
					status: "success",
					description: msg,
					isClosable: true,
				});
				router.push(`/items/${res.data.itemId}`);
			})
			.catch((error) => {
				const err = error?.response?.data?.err || error?.message || "Unable to submit your listing";
				toast({
					title: "Error",
					status: "error",
					description: err,
					isClosable: true,
				});
			})
			.finally(() => {
				actions.setSubmitting(false);
			});
	};

	return (
		<Formik
			initialValues={initialValues}
			onSubmit={onSubmit}
			validationSchema={HouseAddItemSchema}
			validateOnBlur={true}
		>
			{(formik) => (
				<form
					onSubmit={formik.handleSubmit}
					onReset={formik.handleReset}
				>
					<Flex direction="column" gap={{ base: 5, md: 6 }}>
						<Modal
							closeOnOverlayClick={false}
							closeOnEsc={false}
							onClose={() => {}}
							isOpen={formik.isSubmitting}
						>
							<ModalOverlay></ModalOverlay>
							<ModalContent p="10">
								<ModalBody
									display={"flex"}
									flexDirection={"column"}
									alignItems={"center"}
									justifyContent="center"
								>
									<CircularProgress
										size={"150px"}
										value={uploadProgress}
									>
										<CircularProgressLabel>
											{uploadProgress}%
										</CircularProgressLabel>
									</CircularProgress>
									<Heading mt="4" fontSize="lg">
										{text.uploading}
									</Heading>
								</ModalBody>
							</ModalContent>
						</Modal>
						<SimpleGrid spacing="5">
							<InputField
								formik={formik}
								label={text.title}
								name="title"
								type="text"
							/>
						</SimpleGrid>
						<SimpleGrid columns={[1, 2, 3]} spacing="5" my="0">
							<FormControl>
								<FormLabel htmlFor="priceType">{text.priceType}</FormLabel>
								<Select
									id="priceType"
									name="priceType"
									value={formik.values.priceType}
									onChange={formik.handleChange}
									variant={"filled"}
								>
										<option value="FIXED">{text.fixed}</option>
									<option value="NEGOTIABLE">
											{text.negotiable}
									</option>
								</Select>
							</FormControl>
							<InputField
								formik={formik}
								label={text.price}
								name="price"
								type="number"
								suffix={<Text>ETB</Text>}
							/>
							<FormControl>
								<FormLabel htmlFor="type">{text.rentOrSale}</FormLabel>
								<Select
									id="type"
									name="type"
									value={formik.values.type}
									onChange={formik.handleChange}
									variant={"filled"}
								>
										<option value="RENT">{text.rent}</option>
										<option value="FORSALE">{text.sale}</option>
								</Select>
							</FormControl>
						</SimpleGrid>
						<SimpleGrid columns={[1, 2]} spacing="5" my="0">
							<InputField
								formik={formik}
								label={text.floorArea}
								name="area"
								type="number"
								suffix={
									<Text>
										m<sup>2</sup>
									</Text>
								}
							/>
							<InputField
								formik={formik}
								label={text.rooms}
								name="room"
								type="number"
							/>
						</SimpleGrid>
						<SimpleGrid columns={[1, 2]} spacing="5" my="0">
							<InputField
								formik={formik}
								label={text.region}
								name="region"
								type="text"
							/>
							<InputField
								formik={formik}
								label={text.city}
								name="city"
								type="text"
							/>
						</SimpleGrid>

						<FormControl>
							<FormLabel htmlFor="description">{text.description}</FormLabel>
							<Textarea
								id="description"
								name="description"
								onChange={formik.handleChange}
								value={formik.values.description}
								placeholder={text.description}
								variant={"filled"}
							></Textarea>
						</FormControl>

						<FormControl>
							<FormLabel htmlFor="house-photos">{text.photos}</FormLabel>
							<Input
								id="house-photos"
								onChange={(ev) => {
									let files = ev.target.files;
									formik.setFieldValue(
										"files",
										Array.from(files)
									);
								}}
								variant={"filled"}
								h="auto"
								minH="12"
								py="2"
								sx={{ "&::file-selector-button": { mr: 3, px: 3, py: 2, border: 0, borderRadius: "md", bg: uploadButtonBg, color: uploadButtonText, fontWeight: 600, cursor: "pointer" } }}
								type="file"
								name="files"
								accept="image/*"
								placeholder="images"
								multiple
							></Input>
						</FormControl>
						<Grid
							gridTemplateColumns="repeat(auto-fit, 200px)"
							gap={"5"}
						>
							{formik.values.files.map((file, index) => {
								return (
									<Image
										alt={"Selected listing photo " + (index + 1)}
										key={index}
										background={"black"}
										boxShadow="md"
										borderRadius={"md"}
										width={"200px"}
										height={"200px"}
										objectFit="contain"
										src={URL.createObjectURL(file)}
									></Image>
								);
							})}
						</Grid>
						<Flex alignSelf={{ base: "stretch", sm: "flex-end" }} gap="3" direction={{ base: "column-reverse", sm: "row" }}>
							<Button
								type="submit"
								w={{ base: "full", sm: "auto" }}
								colorScheme="orange"
								leftIcon={<MdSave />}
								disabled={
									formik.isSubmitting || !formik.isValid
								}
							>
								{formik.isSubmitting ? text.uploading : text.submit}
							</Button>
							<Button
								type="button"
								w={{ base: "full", sm: "auto" }}
								leftIcon={<MdClose />}
								onClick={() => {
									router.push("/dashboard");
								}}
							>
								{text.cancel}
							</Button>
						</Flex>
					</Flex>
				</form>
			)}
		</Formik>
	);
};
